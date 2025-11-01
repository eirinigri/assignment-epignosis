import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface AnalyticsData {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageApprovalTime: number;
  requestsByMonth: Array<{ month: string; count: number }>;
  topRequesters: Array<{ user_name: string; request_count: number }>;
  vacationUtilization: Array<{
    user_name: string;
    days_used: number;
    days_total: number;
    utilization_percent: number;
  }>;
}

export default function ManagerAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div>Error loading analytics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">Vacation Portal</h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => navigate('/manager/users')}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Users
                </button>
                <button
                  onClick={() => navigate('/manager/requests')}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Vacation Requests
                </button>
                <button
                  onClick={() => navigate('/manager/analytics')}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-800 font-medium rounded-lg"
                >
                  Analytics
                </button>
              </nav>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Manager
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Requests</div>
            <div className="text-3xl font-bold text-gray-900">{analytics.totalRequests}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-600">{analytics.approvedRequests}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-red-600">{analytics.rejectedRequests}</div>
          </div>
        </div>

        {/* Average Approval Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Approval Time</h3>
          <div className="text-4xl font-bold text-blue-600">
            {analytics.averageApprovalTime.toFixed(1)} hours
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Requesters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Requesters</h3>
            <div className="space-y-3">
              {analytics.topRequesters.slice(0, 5).map((requester, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{requester.user_name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {requester.request_count} requests
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vacation Utilization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vacation Utilization</h3>
            <div className="space-y-3">
              {analytics.vacationUtilization.slice(0, 5).map((util, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{util.user_name}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {util.utilization_percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${util.utilization_percent}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {util.days_used} / {util.days_total} days used
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requests by Month */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests by Month (Last 12 Months)</h3>
          <div className="space-y-2">
            {analytics.requestsByMonth.map((month, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">{month.month}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${(month.count / Math.max(...analytics.requestsByMonth.map(m => m.count))) * 100}%`,
                      minWidth: '30px'
                    }}
                  >
                    <span className="text-xs font-semibold text-white">{month.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
