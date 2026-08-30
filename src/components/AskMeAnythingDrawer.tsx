import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { safeStorage } from "../utils/storage";

interface Citation {
  type: string;
  id: string;
  title: string;
  link?: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

const PRESET_PROMPTS = [
  "What happened to case RV-10291?",
  "How much revenue has been recovered?",
  "What are our active retry thresholds and limits?",
  "Is the cryptographic audit ledger verified?",
  "How is the 4-factor risk score calculated?"
];

export const AskMeAnythingDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => {
    const saved = safeStorage.getItem("revivepay_chat_session");
    if (saved) return saved;
    const newId = `sess_${Math.random().toString(36).substring(2, 11)}`;
    safeStorage.setItem("revivepay_chat_session", newId);
    return newId;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeToolMessage, setActiveToolMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history from backend on open
  useEffect(() => {
    if (!isOpen) return;

    fetch(`/api/chat/history?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((m) => ({
              id: m.id || `msg_${Math.random()}`,
              sender: m.sender === "user" ? "user" : "bot",
              text: m.text,
              citations: m.citations || []
            }))
          );
        } else {
          setMessages([
            {
              id: "msg_init",
              sender: "bot",
              text: "👋 Hi there! I'm RevivePay AI. Ask me about live payment failures, specific cases (e.g. `RV-10291`), platform revenue telemetry, or policy guardrail rules.",
              citations: []
            }
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            id: "msg_init",
            sender: "bot",
            text: "👋 Hi there! I'm RevivePay AI. Ask me about live payment failures, specific cases (e.g. `RV-10291`), platform revenue telemetry, or policy guardrail rules.",
            citations: []
          }
        ]);
      });
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeToolMessage]);

  const handleClearHistory = async () => {
    try {
      await fetch(`/api/chat/history?session_id=${sessionId}`, { method: "DELETE" });
      setMessages([
        {
          id: `msg_cleared_${Date.now()}`,
          sender: "bot",
          text: "Chat history cleared. How can I help you investigate revenue telemetry today?",
          citations: []
        }
      ]);
    } catch {
      // ignore
    }
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, sender: "user", text: userText }
    ];

    setMessages(newMessages);
    setInputValue("");
    setIsStreaming(true);
    setActiveToolMessage("Analyzing live payment graph...");

    // Insert empty placeholder bot message
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, sender: "bot", text: "", citations: [], isStreaming: true }
    ]);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userText
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to AI engine");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let accumulatedCitations: Citation[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr || dataStr === "[DONE]") continue;

          let eventType = "token";
          if (dataStr.startsWith('{"type":"tool_call"')) {
            eventType = "tool_call";
          } else if (dataStr.startsWith('{"type":"done"')) {
            eventType = "done";
          }

          if (eventType === "tool_call") {
            try {
              const toolData = JSON.parse(dataStr);
              setActiveToolMessage(toolData.message || "Executing live database query...");
            } catch {
              // ignore
            }
          } else if (eventType === "token") {
            try {
              const tokenData = JSON.parse(dataStr);
              accumulatedText += tokenData.token;
              setActiveToolMessage(null); // Tool completed
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? { ...msg, text: accumulatedText, isStreaming: true }
                    : msg
                )
              );
            } catch {
              // ignore
            }
          } else if (eventType === "done") {
            try {
              const doneData = JSON.parse(dataStr);
              accumulatedCitations = doneData.citations || [];
            } catch {
              // ignore
            }
          }
        }
      }

      // Mark streaming finished
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: accumulatedText || "Telemetry inquiry processed.",
                isStreaming: false,
                citations: accumulatedCitations
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: "I am having trouble reaching the telemetry engine right now. Please try again shortly.",
                isStreaming: false
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveToolMessage(null);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ask Revive AI Assistant"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-md hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] outline-none"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-white shrink-0" />
          <span>Ask Revive AI</span>
        </button>
      )}

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[420px] max-w-full h-[540px] sm:h-[580px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 font-sans">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white font-bold shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Revive AI Assistant</h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    LIVE GROUNDED
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)]">Zero Hallucination Telemetry Agent</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center text-[var(--color-accent)] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[var(--color-accent)] text-white rounded-br-none shadow-sm"
                      : "bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-none shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text || (msg.isStreaming ? "Thinking..." : "")}
                  </div>

                  {/* Inline Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                        Verified Data Sources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, cIdx) => (
                          <Link
                            key={cIdx}
                            to={c.link || "#"}
                            onClick={() => c.link && setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[10px] font-mono font-bold text-[var(--color-accent)] transition-colors"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{c.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Active Tool Execution Indicator */}
            {activeToolMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
                <span>{activeToolMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] block mb-1.5">
                Suggested Telemetry Queries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.slice(0, 3).map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-left cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={onSubmitForm}
            className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about cases (RV-10291), metrics, or policy..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isStreaming}
              className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-sm"
            >
              {isStreaming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
