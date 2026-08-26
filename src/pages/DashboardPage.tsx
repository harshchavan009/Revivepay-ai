import React, { useState, useEffect } from "react";
import {
  Gauge,
  ChevronDown,
  ChevronUp,
  Info,
  ChevronLeft,
  ChevronRight,
  Globe,
  Facebook,
  Smartphone,
  Layers,
  ArrowUpDown,
  Activity,
  BarChart2,
  Users,
  DollarSign,
  Mail,
  Clock,
  Target,
  Sparkles,
  RefreshCw,
  X,
  Play,
  Pause,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Edit3
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { generateDynamicData, DynamicDashboardState, DashboardMetricCard } from "../services/dynamicDashboardService";

const initialHourlyTelemetry = [
  { time: "09:00 AM", value: 4200 },
  { time: "10:00 AM", value: 5800 },
  { time: "11:00 AM", value: 4900 },
  { time: "12:00 PM", value: 6300 },
  { time: "01:00 PM", value: 5100 },
  { time: "02:00 PM", value: 7200 },
  { time: "03:00 PM", value: 6800 },
];

export const DashboardPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState("Last 7 days");
  const [account, setAccount] = useState("Databox");
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isBannerExpanded, setIsBannerExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Dashboard State
  const [dataState, setDataState] = useState<DynamicDashboardState>(() =>
    generateDynamicData(timeFilter, account)
  );

  // Modal inspection & target editing state
  const [activeModalCard, setActiveModalCard] = useState<DashboardMetricCard | null>(null);
  const [editTargetInput, setEditTargetInput] = useState("");
  const [telemetryHistory, setTelemetryHistory] = useState(initialHourlyTelemetry);

  // Recalculate dynamic metrics whenever timeFilter or account changes
  useEffect(() => {
    setDataState(generateDynamicData(timeFilter, account));
  }, [timeFilter, account]);

  // Real-time live auto-streaming interval
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDataState((prevState) => {
        const updatedCards = prevState.cards.map((card) => {
          if (card.type === "sparkline" && card.sparklineData) {
            const delta = Math.floor(Math.random() * 25) - 10;
            const newSparkline = [...card.sparklineData.slice(1), { v: Math.max(20, card.sparklineData[card.sparklineData.length - 1].v + delta) }];
            const newNumeric = Math.max(1, card.numericValue + delta * 5);
            return {
              ...card,
              numericValue: newNumeric,
              value: newNumeric.toLocaleString(),
              sparklineData: newSparkline
            };
          }
          if (card.type === "progress" && card.progressData) {
            const inc = Math.floor(Math.random() * 15) + 1;
            const newCurrent = card.progressData.currentNum + inc;
            const newPct = Math.min(100, Math.round((newCurrent / card.progressData.targetNum) * 100));
            return {
              ...card,
              numericValue: newPct,
              value: `${newPct}%`,
              progressData: {
                ...card.progressData,
                currentNum: newCurrent,
                current: card.id === "pageviews" ? `$${newCurrent.toLocaleString()}` : `${newCurrent}`,
                percentage: newPct
              }
            };
          }
          return card;
        });

        // Subtly fluctuate trending up items
        const updatedTrendingUp = prevState.trendingUp.map((item) => {
          if (item.label === "Impressions") {
            const raw = parseInt(item.value.replace(/,/g, "")) + Math.floor(Math.random() * 80) + 10;
            return { ...item, value: raw.toLocaleString() };
          }
          if (item.label === "Gross sales") {
            const raw = parseInt(item.value.replace(/[^0-9]/g, "")) + Math.floor(Math.random() * 12) + 2;
            return { ...item, value: `$${raw.toLocaleString()}` };
          }
          return item;
        });

        return {
          ...prevState,
          cards: updatedCards,
          trendingUp: updatedTrendingUp
        };
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Manual refresh trigger
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDataState(generateDynamicData(timeFilter, account));
      setIsRefreshing(false);
      showToast("Metrics updated from real-time data provider!");
    }, 500);
  };

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simulate an event (e.g. +100 Visits, +1 Deal)
  const handleSimulateEvent = (cardId: string) => {
    setDataState((prev) => {
      const cards = prev.cards.map((c) => {
        if (c.id === cardId) {
          if (c.type === "sparkline") {
            const added = c.numericValue + 500;
            return { ...c, numericValue: added, value: added.toLocaleString() };
          } else if (c.progressData) {
            const addedCurrent = c.progressData.currentNum + 250;
            const pct = Math.min(100, Math.round((addedCurrent / c.progressData.targetNum) * 100));
            return {
              ...c,
              numericValue: pct,
              value: `${pct}%`,
              progressData: {
                ...c.progressData,
                currentNum: addedCurrent,
                current: c.id === "pageviews" ? `$${addedCurrent.toLocaleString()}` : `${addedCurrent}`,
                percentage: pct
              }
            };
          }
        }
        return c;
      });
      return { ...prev, cards };
    });
    showToast(`Simulated live event boost for ${cardId}!`);
  };

  // Save edited target
  const handleSaveTarget = () => {
    if (!activeModalCard || !editTargetInput) return;
    const num = parseInt(editTargetInput.replace(/[^0-9]/g, ""));
    if (isNaN(num) || num <= 0) return;

    setDataState((prev) => {
      const cards = prev.cards.map((c) => {
        if (c.id === activeModalCard.id && c.progressData) {
          const pct = Math.min(100, Math.round((c.progressData.currentNum / num) * 100));
          return {
            ...c,
            numericValue: pct,
            value: `${pct}%`,
            progressData: {
              ...c.progressData,
              targetNum: num,
              target: activeModalCard.id === "pageviews" ? `$${num.toLocaleString()}` : `${num}`,
              percentage: pct
            }
          };
        }
        return c;
      });
      return { ...prev, cards };
    });

    setActiveModalCard(null);
    showToast(`Updated target goal for ${activeModalCard.title}!`);
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 bg-[#F4F6F9] min-h-screen font-sans text-slate-900 selection:bg-blue-600 selection:text-white relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Layout (Image 2) */}
      <div className="max-w-[1600px] mx-auto bg-white border-x border-b border-slate-200/90 shadow-sm min-h-screen flex flex-col">
        
        {/* TOP HEADER BAR (IMAGE 2) */}
        <header className="px-6 py-3.5 border-b border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0088FF] text-white flex items-center justify-center font-black shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                Good Afternoon, Steve!
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Account Selector Dropdown */}
            <div className="relative">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-400 cursor-pointer outline-none transition-colors"
              >
                <option value="Databox">Databox</option>
                <option value="Razorpay Intelligence">Razorpay Intelligence</option>
                <option value="Acquisition Portal">Acquisition Portal</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Live Streaming Toggle Button */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                isLiveStreaming
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
            >
              {isLiveStreaming ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Live Sync</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-500" />
                  <span>Paused</span>
                </>
              )}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* View Mode Switcher Controls */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-2xs">
              <button className="p-1.5 rounded-md bg-white text-slate-800 shadow-2xs font-bold">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors">
                <Activity className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY LAYOUT: LEFT CONTENT + RIGHT SIDEBAR */}
        <div className="flex-1 flex flex-col lg:flex-row bg-[#F4F6F9]">
          
          {/* MAIN LEFT DASHBOARD AREA */}
          <main className="flex-1 p-6 space-y-6">
            
            {/* TOP HIGHLIGHT SUMMARY BANNER (IMAGE 2) */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900">
                      Showing significant progress
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Here's how your business is doing
                    </p>
                  </div>
                </div>

                {/* Dynamic Time Selector Dropdown */}
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold outline-none cursor-pointer hover:border-slate-400 shadow-2xs transition-colors"
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 90 days">Last 90 days</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Expandable Body Text */}
              {isBannerExpanded && (
                <p className="text-xs leading-relaxed mt-4 pt-4 border-t border-slate-100 text-slate-600 font-medium">
                  {dataState.summary}
                </p>
              )}

              <button
                onClick={() => setIsBannerExpanded(!isBannerExpanded)}
                className="w-full flex items-center justify-center pt-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {isBannerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* PERFORMANCE OVERVIEW HEADER */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Performance overview
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                  {timeFilter} • {account}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setGridPage(Math.max(1, gridPage - 1))}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  disabled={gridPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setGridPage(Math.min(2, gridPage + 1))}
                  className="p-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  disabled={gridPage === 2}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6 DYNAMIC PERFORMANCE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataState.cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => {
                    setActiveModalCard(card);
                    if (card.progressData) {
                      setEditTargetInput(card.progressData.targetNum.toString());
                    }
                  }}
                  className="p-5 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between h-48 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group relative"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">{card.subtitle}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateEvent(card.id);
                        }}
                        title="Simulate Event Boost"
                        className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-700 mt-0.5">{card.title}</p>

                    <h4 className={`text-3xl font-black tracking-tight mt-1 transition-all ${
                      card.colorTheme === "green" ? "text-[#10B981]" : card.colorTheme === "yellow" ? "text-[#F59E0B]" : card.colorTheme === "red" && card.type === "progress" ? "text-rose-600" : "text-slate-900 group-hover:text-blue-600"
                    }`}>
                      {card.value}
                    </h4>
                  </div>

                  {/* Render Sparkline or Progress Bar */}
                  {card.type === "sparkline" && card.sparklineData ? (
                    <div className="h-10 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={card.sparklineData}>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={card.colorTheme === "red" ? "#EF4444" : "#10B981"}
                            fill={card.colorTheme === "red" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)"}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : card.progressData ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>{card.progressData.current}</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-slate-400" /> {card.progressData.target}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            card.colorTheme === "green" ? "bg-[#10B981]" : card.colorTheme === "yellow" ? "bg-[#F59E0B]" : "bg-rose-500"
                          }`}
                          style={{ width: `${card.progressData.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : null}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                      {card.sourceIcon === "website" && <Globe className="w-3.5 h-3.5 text-amber-500" />}
                      {card.sourceIcon === "facebook" && <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />}
                      {card.sourceIcon === "app" && <Smartphone className="w-3.5 h-3.5 text-indigo-600" />}
                      {card.sourceLabel}
                    </span>

                    <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                      card.isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                    }`}>
                      {card.isPositive ? "▲" : "▼"} {card.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* RIGHT SIDEBAR PANEL: DYNAMIC TRENDING UP & TRENDING DOWN */}
          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200/90 p-5 space-y-6 bg-white shrink-0">
            
            {/* TRENDING UP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900">Trending up</h4>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{timeFilter}</span>
              </div>

              <div className="space-y-2">
                {dataState.trendingUp.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg text-xs bg-slate-50/70 border border-slate-200/60 hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      {item.iconType === "dot" && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dotColor || "#10B981" }}></span>}
                      {item.iconType === "clock" && <Clock className="w-3.5 h-3.5 text-sky-500" />}
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{item.value}</span>
                      <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRENDING DOWN */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900">Trending down</h4>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{timeFilter}</span>
              </div>

              <div className="space-y-2">
                {dataState.trendingDown.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg text-xs bg-slate-50/70 border border-slate-200/60 hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      {item.iconType === "dot" && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dotColor || "#EF4444" }}></span>}
                      {item.iconType === "email" && <Mail className="w-3.5 h-3.5 text-sky-500" />}
                      {item.iconType === "user" && <Users className="w-3.5 h-3.5 text-amber-500" />}
                      {item.iconType === "dollar" && <DollarSign className="w-3.5 h-3.5 text-indigo-600" />}
                      {item.iconType === "globe" && <Globe className="w-3.5 h-3.5 text-amber-500" />}
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{item.value}</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>

      </div>

      {/* DYNAMIC TELEMETRY & TARGET EDITING MODAL */}
      {activeModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{activeModalCard.title} Telemetry</h3>
                  <p className="text-xs text-slate-400 font-medium">Real-time performance and dynamic goal tuning</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalCard(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real-time Telemetry Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0088FF" strokeWidth={3} dot={{ r: 4, fill: "#0088FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Goal Target Editing Section for Progress Cards */}
            {activeModalCard.progressData && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Update Target Goal:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTargetInput}
                    onChange={(e) => setEditTargetInput(e.target.value)}
                    placeholder="Enter new target..."
                    className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                  />
                  <button
                    onClick={handleSaveTarget}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSimulateEvent(activeModalCard.id)}
                className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simulate Event Boost (+250)</span>
              </button>
              <button
                onClick={() => setActiveModalCard(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
