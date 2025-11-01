import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { VacationRequest, User } from '../types';

export default function EmployeeRequests() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRequest, setEditingRequest] = useState<VacationRequest | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, userRes] = await Promise.all([
        api.get('/requests'),
        api.get('/auth/me')
      ]);
      setRequests(requestsRes.data.data);
      setUser(userRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const url = params.toString() ? `/requests?${params.toString()}` : '/requests';
      const response = await api.get(url);
      setRequests(response.data.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const openEditModal = (request: VacationRequest) => {
    setEditingRequest(request);
    setEditStartDate(request.start_date);
    setEditEndDate(request.end_date);
    setEditReason(request.reason || '');
  };

  const handleUpdateRequest = async () => {
    if (!editingRequest) return;

    try {
      await api.put(`/requests/${editingRequest.id}`, {
        start_date: editStartDate,
        end_date: editEndDate,
        reason: editReason || undefined
      });
      setEditingRequest(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update request');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      await api.delete(`/requests/${id}`);
      fetchRequests();
    } catch (error) {
      alert('Failed to delete request');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Vacation Portal</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Employee
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
        {/* Vacation Balance Card */}
        {user && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Vacation Balance</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {user.vacation_days_total - user.vacation_days_used}
                  </span>
                  <span className="text-xl opacity-90">days remaining</span>
                </div>
                <p className="mt-1 text-sm opacity-75">
                  {user.vacation_days_used} of {user.vacation_days_total} days used
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-75 mb-2">Usage</div>
                <div className="w-32 h-32 relative">
                  <svg className="transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray={`${(user.vacation_days_used / user.vacation_days_total) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {Math.round((user.vacation_days_used / user.vacation_days_total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Vacation Requests</h2>
              <p className="mt-1 text-sm text-gray-600">
                View and manage your vacation requests
              </p>
            </div>
            <button
              onClick={() => navigate('/employee/requests/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              + Request Vacation
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); fetchRequests(); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Search by reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchRequests}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading requests...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No vacation requests</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new vacation request.</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/employee/requests/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    + New Request
                  </button>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.submitted_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {request.start_date} → {request.end_date}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {request.reason || <span className="italic">No reason</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.ceil((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.manager_notes ? (
                          <div className="text-sm text-gray-600 max-w-xs">
                            <span className="font-medium text-gray-700">Manager: </span>
                            {request.manager_notes}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditModal(request)}
                              className="text-blue-600 hover:text-blue-900 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="text-red-600 hover:text-red-900 transition"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Vacation Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  min={editStartDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Update
              </button>
              <button
                onClick={() => setEditingRequest(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
