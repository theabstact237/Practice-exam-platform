import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAnalyticsDashboard, AnalyticsDashboardData } from '../utils/api';

interface AnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const POLL_MS = 5000;

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#10b981',
  tablet: '#a855f7',
  desktop: '#0ea5e9',
  unknown: '#64748b',
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  unknown: 'Unknown',
};

const emptyDashboard: AnalyticsDashboardData = {
  sessions_today: 0,
  total_sessions: 0,
  exam_completions: 0,
  average_score_percent: 0,
  exam_type_performance: [],
  device_breakdown: { mobile: 0, tablet: 0, desktop: 0, unknown: 0 },
  popular_exam_type: 'solutions_architect',
  popular_exam_label: 'AWS Solutions Architect',
  domain_weakness: [],
  updated_at: '',
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isVisible, onClose }) => {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData>(emptyDashboard);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    const load = async () => {
      const data = await getAnalyticsDashboard();
      if (cancelled) return;
      if (data) {
        setDashboardData(data);
        setLoadError(null);
      } else {
        setLoadError('Could not load analytics. Is the API running and CORS configured?');
      }
      setIsLoading(false);
    };

    void load();
    const interval = setInterval(() => void load(), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isVisible]);

  const examChartRows = dashboardData.exam_type_performance
    .filter((row) => row.sessions > 0 || row.completions > 0)
    .map((row) => ({
      name: row.name.replace(/^AWS\s+/i, '').trim() || row.name,
      sessions: row.sessions,
      completions: row.completions,
    }));

  const deviceTotal =
    dashboardData.device_breakdown.mobile +
    dashboardData.device_breakdown.tablet +
    dashboardData.device_breakdown.desktop +
    dashboardData.device_breakdown.unknown;

  const deviceData = (['mobile', 'tablet', 'desktop', 'unknown'] as const)
    .map((key) => ({
      name: DEVICE_LABELS[key],
      value: dashboardData.device_breakdown[key] ?? 0,
      color: DEVICE_COLORS[key],
    }))
    .filter((d) => d.value > 0);

  const mobilePct =
    deviceTotal > 0
      ? Math.round(((dashboardData.device_breakdown.mobile ?? 0) / deviceTotal) * 100)
      : 0;

  const completionRate =
    dashboardData.total_sessions > 0
      ? Math.round((dashboardData.exam_completions / dashboardData.total_sessions) * 100)
      : 0;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-slate-400 text-sm mt-1">
              Live metrics from all visitors (updates every {POLL_MS / 1000}s)
              {dashboardData.updated_at && (
                <span className="ml-2">
                  · Last sync: {new Date(dashboardData.updated_at).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loadError && (
            <div className="mb-6 bg-amber-900/40 border border-amber-700 text-amber-100 px-4 py-3 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Sessions Today</h3>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '…' : dashboardData.sessions_today}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Total Sessions</h3>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '…' : dashboardData.total_sessions}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Exam Completions</h3>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '…' : dashboardData.exam_completions}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Average Score</h3>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '…' : `${dashboardData.average_score_percent}%`}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Exam Type Performance</h3>
              {examChartRows.length === 0 ? (
                <p className="text-slate-400 text-sm h-[300px] flex items-center justify-center">
                  No exam activity recorded yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={examChartRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="sessions" fill="#0ea5e9" name="Sessions" />
                    <Bar dataKey="completions" fill="#10b981" name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
              {deviceData.length === 0 ? (
                <p className="text-slate-400 text-sm h-[300px] flex items-center justify-center">
                  No session data yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Domain Weakness Across All Users */}
          {(dashboardData.domain_weakness?.length ?? 0) > 0 && (
            <div className="mt-8 bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-1">Most Challenging Domains</h3>
              <p className="text-slate-400 text-xs mb-4">Aggregated from all exam completions — lowest scoring domains shown first.</p>
              <div className="space-y-3">
                {dashboardData.domain_weakness.map((d) => {
                  const isWeak = d.pct < 60;
                  const isMid = d.pct >= 60 && d.pct < 80;
                  const barColor = isWeak ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500';
                  const textColor = isWeak ? 'text-red-400' : isMid ? 'text-amber-400' : 'text-emerald-400';
                  return (
                    <div key={d.domain}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-slate-200 truncate max-w-[55%]">{d.domain}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold ${textColor}`}>{d.pct}%</span>
                          <span className="text-slate-500 text-xs">({d.correct}/{d.total} correct)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Features</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Most Popular Exam (by starts): {dashboardData.popular_exam_label}</li>
                <li>• Contact Form Submissions: {localStorage.getItem('contact_submissions') || '0'}</li>
                <li>• Payment Interest: {localStorage.getItem('payment_clicks') || '0'} clicks</li>
                <li>• Social Media Clicks: {localStorage.getItem('social_clicks') || '0'}</li>
              </ul>
            </div>

            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Average Session: {localStorage.getItem('avg_session_time') || '0'} minutes (local)</li>
                <li>• Return Visitors: {localStorage.getItem('return_visitors') || '0'}% (local)</li>
                <li>• Mobile Share (sessions): {mobilePct}%</li>
                <li>• Exam Completion Rate (completions / sessions): {completionRate}%</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-blue-900 bg-opacity-50 border border-blue-700 p-4 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">📊 How this works</h3>
            <p className="text-blue-200 text-sm">
              Top metrics, exam type bars, and device breakdown are aggregated on the server from all
              visitors (sessions + exam start/complete events). Data refreshes automatically while this
              panel is open. Google Analytics still captures additional marketing and event detail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
