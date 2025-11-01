import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { User } from '../types';

export default function RequestForm() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const daysNeeded = calculateDays();
  const remainingDays = user ? user.vacation_days_total - user.vacation_days_used : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/requests', {
        start_date: startDate,
        end_date: endDate,
        reason: reason || undefined,
      });
      
      navigate('/employee/requests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/employee/requests')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Vacation Portal</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Employee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vacation Balance Info */}
        {user && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Available Vacation Days</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {remainingDays} days
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {user.vacation_days_used} of {user.vacation_days_total} used
                </p>
              </div>
              {daysNeeded > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Requesting</p>
                  <p className={`text-2xl font-bold ${
                    daysNeeded > remainingDays ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {daysNeeded} days
                  </p>
                  {daysNeeded > remainingDays && (
                    <p className="text-xs text-red-600 mt-1">Insufficient balance!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">New Vacation Request</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
              <p className="mt-1 text-sm text-gray-500">End date must be on or after start date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Provide a reason for your vacation request (optional)..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/employee/requests')}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
