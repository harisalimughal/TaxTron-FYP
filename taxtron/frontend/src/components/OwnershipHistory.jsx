import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  ExternalLink,
  Shield,
  History
} from 'lucide-react';
import axios from 'axios';

const OwnershipHistory = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [userTransfers, setUserTransfers] = useState([]);

  useEffect(() => {
    if (vehicleId) {
      fetchOwnershipHistory();
    } else {
      fetchUserTransfers();
    }
  }, [vehicleId]);

  const fetchOwnershipHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`/api/ownership-transfer/history/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHistoryData(response.data.history);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching ownership history:', error);
      setError(error.response?.data?.message || 'Failed to fetch ownership history');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransfers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/ownership-transfer/my-transfers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserTransfers(response.data.transfers);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user transfers:', error);
      setError(error.response?.data?.message || 'Failed to fetch transfer history');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTransferTypeColor = (type) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'transfer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransferTypeIcon = (type) => {
    switch (type) {
      case 'registration':
        return <FileText className="w-4 h-4" />;
      case 'transfer':
        return <Shield className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ownership history...</p>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
          <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
                Go to Dashboard
          </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no vehicleId, show user's transfer history
  if (!vehicleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Transfer History</h1>
                  <p className="text-sm text-gray-600">All your vehicle ownership transfers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {userTransfers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Transfers Found</h2>
                <p className="text-gray-600 mb-6">You haven't made any vehicle transfers yet.</p>
                <button
                  onClick={() => navigate('/ownership-transfer')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Transfer Vehicle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userTransfers.map((transfer, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Transfer #{transfer.transferId}</h3>
                        <p className="text-sm text-gray-600">
                          {transfer.vehicle.make} {transfer.vehicle.model} - {transfer.vehicle.chassisNumber}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">From:</span>
                      <p className="font-medium">{transfer.fromOwner.fullName}</p>
                      <p className="text-xs text-gray-500">{transfer.fromOwner.cnic}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">To:</span>
                      <p className="font-medium">{transfer.toOwner.fullName}</p>
                      <p className="text-xs text-gray-500">{transfer.toOwner.cnic}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Transfer Fee:</span>
                      <p className="font-medium text-green-600">PKR {transfer.transferFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{new Date(transfer.transferDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No History Found</h2>
              <p className="text-gray-600 mb-6">No ownership history found for this vehicle.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ownership History</h1>
                <p className="text-sm text-gray-600">Complete ownership trail for this vehicle</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Car className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Vehicle ID:</span>
              <p className="font-medium">{historyData.vehicleId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Chassis Number:</span>
              <p className="font-medium text-xs">{historyData.chassisNumber}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total Transfers:</span>
              <p className="font-medium text-green-600">{historyData.totalTransfers}</p>
            </div>
          </div>
        </div>

        {/* Ownership Timeline */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Ownership Timeline</h2>
          </div>

          <div className="space-y-6">
            {historyData.ownershipHistory.map((owner, index) => (
              <div key={index} className="relative">
                {/* Timeline Line */}
                {index < historyData.ownershipHistory.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Timeline Icon */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    owner.isCurrentOwner 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getTransferTypeIcon(owner.transferType)}
                  </div>

                  {/* Owner Details */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {owner.ownerName}
                            </h3>
                            {owner.isCurrentOwner && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Current Owner
                    </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">CNIC:</span>
                              <p className="font-medium">{owner.cnic}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium text-xs">{owner.email}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Wallet Address:</span>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-xs">
                                  {owner.walletAddress.slice(0, 6)}...{owner.walletAddress.slice(-4)}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(owner.walletAddress)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Transfer Type:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransferTypeColor(owner.transferType)}`}>
                                {owner.transferType === 'registration' ? 'Initial Registration' : 'Ownership Transfer'}
                    </span>
                  </div>
                </div>

                          {/* Ownership Period */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">From:</span>
                                <span className="font-medium">{formatDate(owner.startDate)}</span>
                              </div>
                              {owner.endDate && (
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">To:</span>
                                  <span className="font-medium">{formatDate(owner.endDate)}</span>
                                </div>
                              )}
                              {!owner.endDate && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600 font-medium">Ongoing</span>
                                </div>
                              )}
                            </div>
                  </div>

                          {/* Transfer ID (if applicable) */}
                          {owner.transferId && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-600">Transfer ID:</span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {owner.transferId}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(owner.transferId)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Copy className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          )}
                  </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => copyToClipboard(owner.walletAddress)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy Wallet</span>
                          </button>
                          {owner.transferId && (
                            <button
                              onClick={() => copyToClipboard(owner.transferId)}
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Copy Transfer ID</span>
                            </button>
                          )}
                        </div>
                      </div>
                  </div>
                  </div>
                </div>
              </div>
                  ))}
                </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {historyData.ownershipHistory.length}
                </div>
                <div className="text-sm text-blue-800">Total Owners</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {historyData.totalTransfers}
                </div>
                <div className="text-sm text-green-800">Transfers Made</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {historyData.ownershipHistory.find(owner => owner.isCurrentOwner)?.ownerName || 'Unknown'}
            </div>
                <div className="text-sm text-purple-800">Current Owner</div>
          </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/ownership-transfer')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Transfer Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnershipHistory;