export interface DashboardMetricCard {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  numericValue: number;
  trend: string;
  isPositive: boolean;
  type: "sparkline" | "progress";
  sparklineData?: { v: number }[];
  progressData?: { current: string; currentNum: number; target: string; targetNum: number; percentage: number };
  sourceLabel: string;
  sourceIcon: "website" | "facebook" | "app";
  colorTheme: "red" | "green" | "yellow" | "blue" | "purple";
}

export interface TrendingItem {
  id: string;
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  iconType: "dot" | "clock" | "email" | "user" | "dollar" | "globe";
  dotColor?: string;
}

export interface DynamicDashboardState {
  timeFilter: string;
  account: string;
  isLiveStreaming: boolean;
  summary: string;
  cards: DashboardMetricCard[];
  trendingUp: TrendingItem[];
  trendingDown: TrendingItem[];
}

const baseAccountMultipliers: Record<string, number> = {
  "Databox": 1.0,
  "Razorpay Intelligence": 1.45,
  "Acquisition Portal": 0.82
};

const baseTimeMultipliers: Record<string, number> = {
  "Last 7 days": 1.0,
  "Last 30 days": 3.9,
  "Last 90 days": 12.4
};

export function generateDynamicData(timeFilter: string, account: string): DynamicDashboardState {
  const mult = (baseTimeMultipliers[timeFilter] || 1.0) * (baseAccountMultipliers[account] || 1.0);

  const baseSessions = Math.round(290879 * mult);
  const basePageviewsPct = Math.min(98, Math.round(56 * Math.min(1.5, Math.max(0.7, mult / (baseTimeMultipliers[timeFilter] || 1)))));
  const pageviewsVal = Math.round(3541 * mult);
  const pageviewsTarget = Math.round(6500 * mult);
  
  const baseLikes = Math.round(5283 * mult);
  const newLikesPct = Math.min(99, Math.round(48 * Math.min(1.4, Math.max(0.8, mult / (baseTimeMultipliers[timeFilter] || 1)))));
  const newLikesCount = Math.round(48 * mult);
  const newLikesTarget = Math.round(100 * mult);

  const baseEvents = Math.round(19293 * mult);
  const sessionsGoalPct = Math.min(95, Math.round(14 * Math.min(2.5, mult)));
  const sessionsGoalCount = (baseSessions / 1000).toFixed(1) + "k";
  const sessionsGoalTarget = mult > 3 ? (mult > 8 ? "10M" : "5M") : "2M";

  return {
    timeFilter,
    account,
    isLiveStreaming: true,
    summary: timeFilter === "Last 7 days"
      ? `In the last week, traffic for ${account} remained steady with an average of 500 daily visits. There was a slight increase in engagement with a 5% rise in pageviews per session. However, the bounce rate increased by 2% to a total of 45%.`
      : timeFilter === "Last 30 days"
      ? `Over the last 30 days, ${account} recorded $${(pageviewsVal).toLocaleString()} in customer volume across core channels. Pageviews expanded by 12.1%, supported by automated payment retries.`
      : `Quarter-to-date performance for ${account} achieved a 90-day peak with $${(pageviewsVal).toLocaleString()} captured revenue and 89% overall target fulfillment.`,
    cards: [
      {
        id: "sessions",
        title: "Sessions",
        subtitle: "Month to date",
        value: baseSessions.toLocaleString(),
        numericValue: baseSessions,
        trend: mult > 3 ? "+8.2%" : "-3.4%",
        isPositive: mult > 3,
        type: "sparkline",
        sparklineData: [
          { v: 120 * mult }, { v: 140 * mult }, { v: 110 * mult }, { v: 160 * mult }, { v: 90 * mult }, { v: 85 * mult }, { v: 130 * mult }, { v: 100 * mult }, { v: 95 * mult }
        ],
        sourceLabel: "My Website",
        sourceIcon: "website",
        colorTheme: mult > 3 ? "green" : "red"
      },
      {
        id: "pageviews",
        title: "Pageviews",
        subtitle: "Month to date",
        value: `${basePageviewsPct}%`,
        numericValue: basePageviewsPct,
        trend: "+3.4%",
        isPositive: true,
        type: "progress",
        progressData: {
          current: `$${pageviewsVal.toLocaleString()}`,
          currentNum: pageviewsVal,
          target: `$${pageviewsTarget.toLocaleString()}`,
          targetNum: pageviewsTarget,
          percentage: basePageviewsPct
        },
        sourceLabel: "My Website",
        sourceIcon: "website",
        colorTheme: "green"
      },
      {
        id: "page_likes",
        title: "Page Likes",
        subtitle: "Month to date",
        value: baseLikes.toLocaleString(),
        numericValue: baseLikes,
        trend: "+1.2%",
        isPositive: true,
        type: "sparkline",
        sparklineData: [
          { v: 50 * mult }, { v: 65 * mult }, { v: 60 * mult }, { v: 80 * mult }, { v: 75 * mult }, { v: 90 * mult }, { v: 110 * mult }, { v: 105 * mult }, { v: 125 * mult }
        ],
        sourceLabel: "My Facebook page",
        sourceIcon: "facebook",
        colorTheme: "green"
      },
      {
        id: "new_likes",
        title: "New Likes",
        subtitle: "Month to date",
        value: `${newLikesPct}%`,
        numericValue: newLikesPct,
        trend: "+1.2%",
        isPositive: true,
        type: "progress",
        progressData: {
          current: `${newLikesCount}`,
          currentNum: newLikesCount,
          target: `${newLikesTarget}`,
          targetNum: newLikesTarget,
          percentage: newLikesPct
        },
        sourceLabel: "My Website",
        sourceIcon: "facebook",
        colorTheme: "yellow"
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Month to date",
        value: baseEvents.toLocaleString(),
        numericValue: baseEvents,
        trend: "+4.8%",
        isPositive: true,
        type: "sparkline",
        sparklineData: [
          { v: 80 * mult }, { v: 95 * mult }, { v: 70 * mult }, { v: 110 * mult }, { v: 105 * mult }, { v: 140 * mult }, { v: 120 * mult }, { v: 150 * mult }, { v: 160 * mult }
        ],
        sourceLabel: "My App",
        sourceIcon: "app",
        colorTheme: "green"
      },
      {
        id: "sessions_goal",
        title: "Sessions",
        subtitle: "Month to date",
        value: `${sessionsGoalPct}%`,
        numericValue: sessionsGoalPct,
        trend: "-3.4%",
        isPositive: false,
        type: "progress",
        progressData: {
          current: sessionsGoalCount,
          currentNum: Math.round(baseSessions / 1000),
          target: sessionsGoalTarget,
          targetNum: 2000,
          percentage: sessionsGoalPct
        },
        sourceLabel: "My Website",
        sourceIcon: "website",
        colorTheme: "red"
      }
    ],
    trendingUp: [
      { id: "t1", label: "Impressions", value: Math.round(1732939 * mult).toLocaleString(), trend: "▲ 432%", isPositive: true, iconType: "dot", dotColor: "#F59E0B" },
      { id: "t2", label: "Deals", value: Math.round(292 * mult).toLocaleString(), trend: "▲ 183%", isPositive: true, iconType: "dot", dotColor: "#334155" },
      { id: "t3", label: "Resolution time", value: "13h 49m 13s", trend: "▲ 39%", isPositive: true, iconType: "clock" },
      { id: "t4", label: "Gross sales", value: `$${Math.round(544 * mult).toLocaleString()}`, trend: "▲ 38.2%", isPositive: true, iconType: "dot", dotColor: "#10B981" },
      { id: "t5", label: "MRR", value: `$${(732.9 * Math.min(2, mult)).toFixed(1)}k`, trend: "▲ 2%", isPositive: true, iconType: "dot", dotColor: "#4F46E5" },
    ],
    trendingDown: [
      { id: "d1", label: "Impressions", value: Math.round(10292 * mult).toLocaleString(), trend: "▼ 248%", isPositive: false, iconType: "dot", dotColor: "#EC4899" },
      { id: "d2", label: "Emails sent", value: Math.round(129 * mult).toLocaleString(), trend: "▼ 92%", isPositive: false, iconType: "email" },
      { id: "d3", label: "Users", value: Math.round(1292 * mult).toLocaleString(), trend: "▼ 84%", isPositive: false, iconType: "user" },
      { id: "d4", label: "Churned revenue", value: `$${Math.round(100 * mult).toLocaleString()}`, trend: "▼ 31.3%", isPositive: false, iconType: "dollar" },
      { id: "d5", label: "Sessions", value: `${(1.9 * Math.min(3, mult)).toFixed(1)}M`, trend: "▼ 2%", isPositive: false, iconType: "globe" },
    ]
  };
}
