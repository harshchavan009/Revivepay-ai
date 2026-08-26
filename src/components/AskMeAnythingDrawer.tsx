import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  HelpCircle
} from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  actionLink?: {
    label: string;
    to: string;
  };
}

const PRESET_QUESTIONS = [
  "How does Revive recover up to 65.2% of failed payments?",
  "What 200+ signals are analyzed per transaction?",
  "How do I connect my Razorpay or Chargebee account?",
  "What's the difference between Revive and dumb fixed retries?",
  "How does Revive handle abandoned checkouts?"
];

const ANSWERS: Record<string, { text: string; link?: { label: string; to: string } }> = {
  "How does Revive recover up to 65.2% of failed payments?": {
    text: "Revive transforms naive retry attempts into precision interventions. Instead of spamming a customer's card at arbitrary intervals, Revive analyzes 200+ signals (including bank downtime, issuer risk appetite, customer salary cycles, and time zones) to execute retries at the exact millisecond when approval probability exceeds 88%.",
    link: { label: "Explore Interactive Case RV-10291", to: "/cases/RV-10291" }
  },
  "What 200+ signals are analyzed per transaction?": {
    text: "Revive's ML model aggregates 5 distinct signal vectors:\n• Issuer & BIN Telemetry: Real-time bank switch health and authorization response codes.\n• Behavioral & Funding: Salary credit dates, historical card refill windows, and recurring billing histories.\n• Gateway Routing: Latency benchmarks across Razorpay, HDFC, ICICI, and Axis direct integrations.\n• Risk & Velocity: Transaction amount risk scores and velocity cool-downs.\n• Dunning Sentiment: Customer engagement across WhatsApp, SMS, and Email.",
    link: { label: "Test in Simulation Lab", to: "/simulation" }
  },
  "How do I connect my Razorpay or Chargebee account?": {
    text: "Revive connects in under 3 minutes with zero code! Simply provide your Razorpay Key & Secret or Chargebee API Token in Settings. Revive automatically provisions a secure webhook listener for payment.failed, subscription.charged, and invoice.payment_failed events.",
    link: { label: "Go to Integration Settings", to: "/settings" }
  },
  "What's the difference between Revive and dumb fixed retries?": {
    text: "Traditional billing engines use dumb fixed schedules (e.g., retry after 24h, 48h, 72h). If a payment failed due to an expired card or closed account, fixed retries cause high merchant decline penalties. If it failed due to insufficient funds mid-week, retrying before payday wastes your attempt limit. Revive dynamically selects the right moment and gateway route.",
    link: { label: "View Policy Rules", to: "/policies" }
  },
  "How does Revive handle abandoned checkouts?": {
    text: "Revive monitors checkout drop-offs and dispatches intelligent high-conversion WhatsApp & SMS reminders with 1-click UPI links and dynamic tokenized discounts before the customer buys from a competitor.",
    link: { label: "Open Checkout Recovery", to: "/checkout" }
  }
};

export const AskMeAnythingDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "👋 Hi there! I'm Revive AI. Ask me anything about payment recovery, Razorpay integration, or our 200+ ML signal engine."
    }
  ]);
  const [inputValue, setInputValue] = useState<string>("");

  const handleSelectQuestion = (q: string) => {
    const answerData = ANSWERS[q] || {
      text: `Revive Pay AI autonomously monitors failed payments and optimizes recovery using 200+ signals. Try clicking into the Interactive Case or Simulation Lab to see it in action!`,
      link: { label: "Launch Interactive Demo", to: "/cases/RV-10291" }
    };

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: q },
      { sender: "bot", text: answerData.text, actionLink: answerData.link }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");

    // Look for matching keyword
    let botReply: { text: string; link?: { label: string; to: string } } = {
      text: "Revive AI uses 200+ telemetry signals to automatically recover lost SaaS and fintech revenue. Check our live dashboard or simulation lab for real-time recovery experiments!",
      link: { label: "Launch Live Dashboard", to: "/dashboard" }
    };

    if (userText.toLowerCase().includes("razorpay") || userText.toLowerCase().includes("chargebee")) {
      botReply = ANSWERS["How do I connect my Razorpay or Chargebee account?"];
    } else if (userText.toLowerCase().includes("signal") || userText.toLowerCase().includes("ml")) {
      botReply = ANSWERS["What 200+ signals are analyzed per transaction?"];
    } else if (userText.toLowerCase().includes("rate") || userText.toLowerCase().includes("roi") || userText.toLowerCase().includes("recover")) {
      botReply = ANSWERS["How does Revive recover up to 65.2% of failed payments?"];
    }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
      { sender: "bot", text: botReply.text, actionLink: botReply.link }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#081B2A] hover:bg-[#0C2438] text-white border border-[#1B4B6F] shadow-2xl shadow-cyan-950/80 transition-all duration-300 hover:scale-105 active:scale-95 group"
      >
        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
          <MessageSquare className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        </div>
        <span className="text-xs font-semibold text-slate-200 tracking-tight">Ask Me Anything</span>
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] flex flex-col rounded-2xl bg-[#081724]/95 border border-[#163E5C] shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[#163E5C] bg-[#0A1F30]/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-900/30">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>Revive AI Assistant</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    ONLINE
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">Autonomous Revenue Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-cyan-600 text-white rounded-tr-sm"
                      : "bg-[#0E283C] text-slate-200 border border-[#1A4B6E] rounded-tl-sm space-y-2"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.actionLink && (
                    <Link
                      to={msg.actionLink.to}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-colors mt-1"
                    >
                      <span>{msg.actionLink.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Prompts */}
            <div className="pt-2">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-cyan-400" />
                <span>Suggested Questions:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuestion(q)}
                    className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-[#0C2234] hover:bg-[#123048] text-slate-300 hover:text-cyan-300 border border-[#163E5C] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#163E5C] bg-[#0A1F30]/80 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Revive AI anything..."
              className="flex-1 bg-[#061420] border border-[#194668] text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 font-sans placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
