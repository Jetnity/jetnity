// lib/analytics/insights.ts
export type TimeseriesPoint = {
  d: string;            // yyyy-mm-dd
  impressions: number;
  views: number;
  likes: number;
  comments: number;
}

export type HeatCell = {
  dow: number;          // 0=So ... 6=Sa (UTC)
  hour: number;         // 0..23
  sessions: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
}

export type TopItemLite = {
  session_id: string;
  created_at?: string | null;
  impact_score?: number | null;
  content_type?: string | null;
  impressions?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
}

export type Insight = {
  title: string;
  body: string;
  kind: 'positive' | 'warning' | 'info';
  stat?: string;
  tag?: string; // e.g. "Timing", "Momentum"
};

// ---------- helpers ----------
const DOW = ['So','Mo','Di','Mi','Do','Fr','Sa'];

function byDateAsc(a: TimeseriesPoint, b: TimeseriesPoint) {
  return a.d.localeCompare(b.d);
}

function sum(points: TimeseriesPoint[]) {
  return points.reduce(
    (acc, p) => {
      acc.impressions += p.impressions || 0;
      acc.views += p.views || 0;
      acc.likes += p.likes || 0;
      acc.comments += p.comments || 0;
      return acc;
    },
    { impressions: 0, views: 0, likes: 0, comments: 0 }
  );
}

function pct(n: number) {
  const s = (n * 100).toFixed(1);
  return `${s}%`;
}

function median(nums: number[]) {
  if (!nums.length) return 0;
  const arr = [...nums].sort((a,b) => a - b);
  const m = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
}

// ---------- core ----------
export function computeInsights(
  series: TimeseriesPoint[],
  heat: HeatCell[],
  topItems: TopItemLite[],
  daysWindow: number | 'all'
): Insight[] {
  const insights: Insight[] = [];
  const ordered = [...series].sort(byDateAsc);

  // 1) Momentum (letzte 7 vs. vorherige 7 — wenn genug Daten)
  const span = typeof daysWindow === 'number' ? Math.min(daysWindow, 28) : 28;
  const last = ordered.slice(-Math.min(ordered.length, span));
  const last7 = last.slice(-7);
  const prev7 = last.slice(-14, -7);
  if (last7.length && prev7.length) {
    const a = sum(last7);
    const b = sum(prev7);
    const vrPrev = b.impressions > 0 ? b.views / b.impressions : 0;
    const vrCur = a.impressions > 0 ? a.views / a.impressions : 0;
    const erPrev = b.impressions > 0 ? (b.likes + b.comments) / b.impressions : 0;
    const erCur = a.impressions > 0 ? (a.likes + a.comments) / a.impressions : 0;

    const viewsDelta = b.views ? (a.views - b.views) / b.views : 0;
    const vRateDelta = vrPrev ? (vrCur - vrPrev) / vrPrev : 0;
    const eRateDelta = erPrev ? (erCur - erPrev) / erPrev : 0;

    const sign = viewsDelta >= 0 ? 'positive' : 'warning';
    insights.push({
      title: viewsDelta >= 0 ? 'Momentum steigt' : 'Momentum fällt',
      body:
        `Views ${viewsDelta >= 0 ? '↑' : '↓'} ${pct(Math.abs(viewsDelta))} ` +
        `· View-Rate ${vRateDelta >= 0 ? '↑' : '↓'} ${pct(Math.abs(vRateDelta))} ` +
        `· Engagement-Rate ${eRateDelta >= 0 ? '↑' : '↓'} ${pct(Math.abs(eRateDelta))} (letzte 7 Tage ggü. Vorwoche).`,
      kind: sign,
      tag: 'Momentum',
    });
  }

  // 2) Beste Posting-Zeit (UTC) nach Engagement/Impression
  const heatWithRates = heat
    .filter(c => (c.impressions ?? 0) > 0)
    .map(c => ({
      ...c,
      eRate: (c.likes + c.comments) / Math.max(1, c.impressions),
      vRate: c.views / Math.max(1, c.impressions),
    }));
  if (heatWithRates.length) {
    const medER = median(heatWithRates.map(c => c.eRate));
    const best = heatWithRates.reduce((m, c) => (c.eRate > m.eRate ? c : m), heatWithRates[0]);
    const uplift = medER ? (best.eRate - medER) / medER : 0;
    insights.push({
      title: 'Beste Zeit (UTC)',
      body: `${DOW[best.dow]} ${String(best.hour).padStart(2,'0')}:00–${String((best.hour+1)%24).padStart(2,'0')} — ` +
            `Engagement-Rate ${pct(best.eRate)} (${uplift >= 0 ? '↑' : '↓'} ${pct(Math.abs(uplift))} vs. Median).`,
      kind: 'positive',
      tag: 'Timing',
    });

    // Schwächster Wochentag (nach View-Rate)
    const byDow = new Map<number, { views: number; imp: number }>();
    for (const c of heatWithRates) {
      const e = byDow.get(c.dow) ?? { views: 0, imp: 0 };
      e.views += c.views;
      e.imp += c.impressions;
      byDow.set(c.dow, e);
    }
    const dowRates = [...byDow.entries()].map(([dow, v]) => ({
      dow,
      vRate: v.imp > 0 ? v.views / v.imp : 0,
    }));
    if (dowRates.length) {
      const worst = dowRates.reduce((m, x) => (x.vRate < m.vRate ? x : m), dowRates[0]);
      insights.push({
        title: 'Schwächster Wochentag',
        body: `${DOW[worst.dow]} zeigt die niedrigste View-Rate (${pct(worst.vRate)}). ` +
              `Teste alternative Slots oder andere Segmente.`,
        kind: 'info',
        tag: 'Timing',
      });
    }
  }

  // 3) Bestes Segment (aus TopItems; Fallback auf Impact)
  if (topItems.length) {
    const agg = new Map<string, { impact: number; n: number; views: number; imp: number }>();
    for (const t of topItems) {
      const key = (t.content_type ?? 'other').toLowerCase();
      const e = agg.get(key) ?? { impact: 0, n: 0, views: 0, imp: 0 };
      e.impact += Number(t.impact_score ?? 0);
      e.views += Number(t.views ?? 0);
      e.imp += Number(t.impressions ?? 0);
      e.n += 1;
      agg.set(key, e);
    }
    const list = [...agg.entries()].map(([k, v]) => ({
      type: k,
      avgImpact: v.n ? v.impact / v.n : 0,
      vRate: v.imp > 0 ? v.views / v.imp : 0,
      n: v.n,
    }));
    if (list.length) {
      const best = list.reduce((m, x) => (x.avgImpact > m.avgImpact ? x : m), list[0]);
      insights.push({
        title: 'Bestes Segment',
        body: `„${best.type}“ erzielt den höchsten Ø-Impact (${best.avgImpact.toFixed(1)}) ` +
              `und eine View-Rate von ${pct(best.vRate)} (n=${best.n}).`,
        kind: 'positive',
        tag: 'Segment',
      });
    }
  }

  // 4) Streak (letzte 3 Tage Views ↑ oder ↓)
  if (ordered.length >= 4) {
    const last4 = ordered.slice(-4);
    const v = last4.map(p => p.views);
    const up3 = v[1] < v[2] && v[2] < v[3];
    const down3 = v[1] > v[2] && v[2] > v[3];
    if (up3) {
      insights.push({
        title: 'Aufwärtstrend',
        body: 'Views steigen seit 3 Tagen in Folge.',
        kind: 'positive',
        tag: 'Trend',
      });
    } else if (down3) {
      insights.push({
        title: 'Abwärtstrend',
        body: 'Views fallen seit 3 Tagen in Folge. Prüfe Inhalte & Veröffentlichungszeit.',
        kind: 'warning',
        tag: 'Trend',
      });
    }
  }

  return insights;
}
