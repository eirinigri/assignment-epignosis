import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { VacationRequest } from '../types';

export default function ManagerRequests() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [managerNotes, setManagerNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const openNotesModal = (request: VacationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setManagerNotes('');
    setShowNotesModal(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest) return;

    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      await api.put(`/requests/${selectedRequest.id}/${endpoint}`, {
        manager_notes: managerNotes || undefined
      });
      setShowNotesModal(false);
      setSelectedRequest(null);
      setManagerNotes('');
      fetchRequests();
    } catch (error) {
      alert(`Failed to ${actionType} request`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

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
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-800 font-medium rounded-lg"
                >
                  Vacation Requests
                </button>
                <button
                  onClick={() => navigate('/manager/analytics')}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
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
        {/* Filters */}
        <div className="mb-6 flex gap-4">
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
            placeholder="Search by employee name or reason..."
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

        {/* Pending Requests Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Requests</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review and approve or reject vacation requests
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
              <p className="mt-1 text-sm text-gray-500">All vacation requests have been processed.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                        <div className="text-sm text-gray-500">{request.user_email}</div>
                      </td>
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
                          {Math.ceil((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {request.reason || <span className="text-gray-400 italic">No reason provided</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openNotesModal(request, 'approve')}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mr-2"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => openNotesModal(request, 'reject')}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          ✗ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Processed Requests Section */}
        {processedRequests.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent History</h2>
              <p className="mt-1 text-sm text-gray-600">
                Previously processed vacation requests
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.start_date} → {request.end_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {request.reason || <span className="text-gray-400 italic">No reason</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Vacation Request
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Employee</div>
              <div className="font-medium text-gray-900">{selectedRequest.user_name}</div>
              <div className="text-sm text-gray-600 mt-2">Dates</div>
              <div className="font-medium text-gray-900">
                {selectedRequest.start_date} → {selectedRequest.end_date}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder={`Add optional notes for the employee...`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitAction}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedRequest(null);
                  setManagerNotes('');
                }}
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
