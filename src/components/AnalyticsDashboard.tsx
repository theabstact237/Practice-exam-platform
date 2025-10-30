import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

interface LocalAnalytics {
  sessionsToday: number;
  totalSessions: number;
  examCompletions: number;
  averageScore: number;
  popularExamType: string;
  deviceBreakdown: { mobile: number; desktop: number };
  questionStats: Array<{ questionId: number; correctRate: number; avgTime: number }>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isVisible, onClose }) => {
  const [analytics, setAnalytics] = useState<LocalAnalytics>({
    sessionsToday: 0,
    totalSessions: 0,
    examCompletions: 0,
    averageScore: 0,
    popularExamType: 'solutions_architect',
    deviceBreakdown: { mobile: 0, desktop: 0 },
    questionStats: []
  });

  useEffect(() => {
    if (isVisible) {
      loadLocalAnalytics();
    }
  }, [isVisible]);

  const loadLocalAnalytics = () => {
    // Load analytics from localStorage (basic implementation)
    const today = new Date().toDateString();
    const sessionsToday = parseInt(localStorage.getItem(`sessions_${today}`) || '0');
    const totalSessions = parseInt(localStorage.getItem('total_sessions') || '0');
    const examCompletions = parseInt(localStorage.getItem('exam_completions') || '0');
    const totalScore = parseInt(localStorage.getItem('total_score') || '0');
    const averageScore = examCompletions > 0 ? Math.round(totalScore / examCompletions) : 0;
    
    // Device breakdown
    const mobileCount = parseInt(localStorage.getItem('mobile_sessions') || '0');
    const desktopCount = parseInt(localStorage.getItem('desktop_sessions') || '0');
    
    // Popular exam type
    const saCount = parseInt(localStorage.getItem('sa_exam_count') || '0');
    const cpCount = parseInt(localStorage.getItem('cp_exam_count') || '0');
    const popularExamType = saCount > cpCount ? 'Solutions Architect' : 'Cloud Practitioner';

    setAnalytics({
      sessionsToday,
      totalSessions,
      examCompletions,
      averageScore,
      popularExamType,
      deviceBreakdown: { mobile: mobileCount, desktop: desktopCount },
      questionStats: [] // Would need more complex tracking for this
    });
  };

  const deviceData = [
    { name: 'Desktop', value: analytics.deviceBreakdown.desktop, color: '#0ea5e9' },
    { name: 'Mobile', value: analytics.deviceBreakdown.mobile, color: '#10b981' }
  ];

  const examTypeData = [
    { name: 'Solutions Architect', sessions: 45, completions: 32 },
    { name: 'Cloud Practitioner', sessions: 38, completions: 28 }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Sessions Today</h3>
              <p className="text-2xl font-bold text-white">{analytics.sessionsToday}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Total Sessions</h3>
              <p className="text-2xl font-bold text-white">{analytics.totalSessions}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Exam Completions</h3>
              <p className="text-2xl font-bold text-white">{analytics.examCompletions}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium">Average Score</h3>
              <p className="text-2xl font-bold text-white">{analytics.averageScore}%</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Exam Type Performance */}
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Exam Type Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={examTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="sessions" fill="#0ea5e9" name="Sessions" />
                  <Bar dataKey="completions" fill="#10b981" name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Device Breakdown */}
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Features</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Most Popular Exam: {analytics.popularExamType}</li>
                <li>• Contact Form Submissions: {localStorage.getItem('contact_submissions') || '0'}</li>
                <li>• Payment Interest: {localStorage.getItem('payment_clicks') || '0'} clicks</li>
                <li>• Social Media Clicks: {localStorage.getItem('social_clicks') || '0'}</li>
              </ul>
            </div>
            
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Average Session: {localStorage.getItem('avg_session_time') || '0'} minutes</li>
                <li>• Return Visitors: {localStorage.getItem('return_visitors') || '0'}%</li>
                <li>• Mobile Users: {Math.round((analytics.deviceBreakdown.mobile / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100) || 0}%</li>
                <li>• Exam Completion Rate: {analytics.totalSessions > 0 ? Math.round((analytics.examCompletions / analytics.totalSessions) * 100) : 0}%</li>
              </ul>
            </div>
          </div>

          {/* Google Analytics Note */}
          <div className="mt-8 bg-blue-900 bg-opacity-50 border border-blue-700 p-4 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">📊 Enhanced Analytics Available</h3>
            <p className="text-blue-200 text-sm">
              This dashboard shows basic local metrics. For comprehensive analytics including geographic data, 
              real-time visitors, traffic sources, and detailed user journeys, check your Google Analytics 4 dashboard.
            </p>
            <p className="text-blue-200 text-sm mt-2">
              <strong>Key GA4 Reports:</strong> Realtime → Events → Custom Events (exam_started, question_answered, etc.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

