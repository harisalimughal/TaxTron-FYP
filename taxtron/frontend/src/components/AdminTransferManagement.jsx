import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Car, 
  User, 
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const AdminTransferManagement = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/ownership-transfer/admin/pending-transfers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransfers(response.data.transfers);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
      setError(error.response?.data?.message || 'Failed to fetch pending transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (transfer, actionType) => {
    setSelectedTransfer(transfer);
    setAction(actionType);
    setNotes('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedTransfer) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = action === 'approve' 
        ? `/api/ownership-transfer/admin/approve/${selectedTransfer.transferId}`
        : `/api/ownership-transfer/admin/reject/${selectedTransfer.transferId}`;

      const payload = action === 'approve' 
        ? { adminNotes: notes }
        : { rejectionReason: notes };

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`${action === 'approve' ? 'Approved' : 'Rejected'} transfer successfully!`);
        setShowModal(false);
        fetchPendingTransfers(); // Refresh the list
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing transfer:`, error);
      setError(error.response?.data?.message || `Failed to ${action} transfer`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_admin_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transfer Management</h1>
              <p className="text-gray-600 mt-2">Review and approve vehicle ownership transfers</p>
            </div>
            <button
              onClick={fetchPendingTransfers}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Transfers List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Transfers ({transfers.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading transfers...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending transfers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <div key={transfer._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {transfer.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(transfer.createdAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Vehicle Details */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <Car className="w-4 h-4 text-green-600" />
                            <span>Vehicle</span>
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Make/Model:</span> {transfer.vehicle?.make} {transfer.vehicle?.model}</p>
                            <p><span className="font-medium">Year:</span> {transfer.vehicle?.year}</p>
                            <p><span className="font-medium">Chassis:</span> {transfer.vehicle?.chassisNumber}</p>
                            <p><span className="font-medium">Registration:</span> {transfer.vehicle?.registrationNumber}</p>
                          </div>
                        </div>

                        {/* From Owner */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>From Owner</span>
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Name:</span> {transfer.fromOwner.fullName}</p>
                            <p><span className="font-medium">CNIC:</span> {transfer.fromOwner.cnic}</p>
                            <p><span className="font-medium">Email:</span> {transfer.fromOwner.email}</p>
                          </div>
                        </div>

                        {/* To Owner */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <span>To Owner</span>
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Name:</span> {transfer.toOwner.fullName}</p>
                            <p><span className="font-medium">CNIC:</span> {transfer.toOwner.cnic}</p>
                            <p><span className="font-medium">Email:</span> {transfer.toOwner.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Transfer Fee:</span> PKR {transfer.transferFee.toLocaleString()}
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAction(transfer, 'approve')}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleAction(transfer, 'reject')}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {action === 'approve' ? 'Approve Transfer' : 'Reject Transfer'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Transfer ID: <span className="font-medium">{selectedTransfer.transferId}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Vehicle: <span className="font-medium">{selectedTransfer.vehicle?.make} {selectedTransfer.vehicle?.model}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === 'approve' ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : 'Please provide a reason for rejection...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required={action === 'reject'}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={submitAction}
                  disabled={loading || (action === 'reject' && !notes.trim())}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    action === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : action === 'approve' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransferManagement;
