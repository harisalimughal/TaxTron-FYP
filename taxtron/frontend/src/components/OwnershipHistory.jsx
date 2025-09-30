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
  History,
  Search,
  X
} from 'lucide-react';
import axios from 'axios';

const OwnershipHistory = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [userTransfers, setUserTransfers] = useState([]);
  const [searchMode, setSearchMode] = useState(!vehicleId);
  const [searchChassis, setSearchChassis] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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

  const searchByChassisNumber = async () => {
    if (!searchChassis.trim()) {
      setError('Please enter a chassis number');
      return;
    }

    try {
      setSearchLoading(true);
      setError('');
      const response = await axios.get(`/api/ownership-transfer/search-history/${searchChassis.trim()}`);

      if (response.data.success) {
        setHistoryData(response.data.history);
        setSearchMode(false);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error searching ownership history:', error);
      setError(error.response?.data?.message || 'Failed to search ownership history');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchChassis('');
    setHistoryData(null);
    setError('');
    setSearchMode(true);
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
    // Check if it's a "no history found" type error
    const isNoHistoryError = error.toLowerCase().includes('no history') || 
                            error.toLowerCase().includes('not found') || 
                            error.toLowerCase().includes('no ownership') ||
                            error.toLowerCase().includes('no records');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              {isNoHistoryError ? (
                <>
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No History Found</h2>
                  <p className="text-gray-600 mb-6">No ownership history records were found for this vehicle.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                </>
              )}
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

  // If no vehicleId and no historyData from search, show search interface or user's transfer history
  if (!vehicleId && !historyData) {
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
                  <h1 className="text-xl font-bold text-gray-900">
                    {searchMode ? 'Search Ownership History' : 'My Transfer History'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {searchMode ? 'Search by chassis number to view complete ownership history' : 'All your vehicle ownership transfers'}
                  </p>
                </div>
              </div>
              {!searchMode && (
                <button
                  onClick={resetSearch}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search History</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Interface */}
        {searchMode && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="text-center mb-6">
                <Search className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Vehicle Ownership History</h2>
                <p className="text-gray-600">Enter the chassis number to view complete ownership history</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchChassis}
                    onChange={(e) => setSearchChassis(e.target.value)}
                    placeholder="Enter chassis number..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && searchByChassisNumber()}
                  />
                  <button
                    onClick={searchByChassisNumber}
                    disabled={searchLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {searchLoading ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{searchLoading ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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

  // Show enhanced timeline for both direct vehicle history and search results
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
                <p className="text-sm text-gray-600">
                  {vehicleId ? 'Complete ownership trail for this vehicle' : 'Complete ownership trail from search results'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Car className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
            </div>
            {!vehicleId && (
              <button
                onClick={resetSearch}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>New Search</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Complete Vehicle Details */}
          {historyData.vehicleDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Vehicle Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                   <span className="text-sm text-gray-600">Make:</span>
                   <p className="font-medium">{historyData.vehicleDetails.make || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Model:</span>
                   <p className="font-medium">{historyData.vehicleDetails.model || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Year:</span>
                   <p className="font-medium">{historyData.vehicleDetails.year || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Engine Number:</span>
                   <p className="font-medium text-xs">{historyData.vehicleDetails.engineNumber || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Color:</span>
                   <p className="font-medium">{historyData.vehicleDetails.color || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Vehicle Type:</span>
                   <p className="font-medium">{historyData.vehicleDetails.vehicleType || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Fuel Type:</span>
                   <p className="font-medium">{historyData.vehicleDetails.fuelType || 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Engine Capacity:</span>
                   <p className="font-medium">{historyData.vehicleDetails.engineCapacity ? `${historyData.vehicleDetails.engineCapacity}cc` : 'Unknown'}</p>
                 </div>
                 <div>
                   <span className="text-sm text-gray-600">Registration Status:</span>
                   <p className="font-medium text-green-600">Approved</p>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Ownership Timeline */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-8">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Ownership Timeline</h2>
          </div>

          <div className="relative">
            {/* Main Timeline Wire */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-blue-400 to-gray-300 rounded-full"></div>
            
            <div className="space-y-8">
              {historyData.ownershipHistory.map((owner, index) => {
                const ownerNumber = index + 1;
                const isLast = index === historyData.ownershipHistory.length - 1;
                
                return (
                  <div key={index} className="relative">
                    {/* Owner Number Badge */}
                    <div className="absolute -left-2 -top-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                        owner.isCurrentOwner 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                      }`}>
                        {ownerNumber}
                      </div>
                    </div>

                    {/* Connection Wire to Next Owner */}
                    {!isLast && (
                      <div className="absolute left-6 top-8 w-0.5 h-12 bg-gradient-to-b from-blue-400 to-blue-300"></div>
                    )}

                    <div className="flex items-start space-x-6 ml-4">
                      {/* Timeline Node */}
                      <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-lg ${
                        owner.isCurrentOwner 
                          ? 'bg-green-50 border-green-400 text-green-600' 
                          : 'bg-blue-50 border-blue-400 text-blue-600'
                      }`}>
                        {getTransferTypeIcon(owner.transferType)}
                      </div>

                      {/* Owner Details Card */}
                      <div className="flex-1 min-w-0">
                        <div className={`rounded-xl p-6 shadow-sm border-2 ${
                          owner.isCurrentOwner 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {owner.ownerName}
                                </h3>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  owner.isCurrentOwner 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {ownerNumber === 1 ? '1st Owner' : 
                                   ownerNumber === 2 ? '2nd Owner' : 
                                   ownerNumber === 3 ? '3rd Owner' : 
                                   `${ownerNumber}th Owner`}
                                </span>
                                {owner.isCurrentOwner && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Current Owner
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-gray-600 font-medium">CNIC:</span>
                                  <p className="font-mono text-sm">{owner.cnic}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 font-medium">Email:</span>
                                  <p className="text-sm">{owner.email}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-gray-600 font-medium">Wallet Address:</span>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-mono text-xs">
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
                              </div>

                              {/* Ownership Period */}
                              <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center space-x-6 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600 font-medium">From:</span>
                                    <span className="font-medium">{formatDate(owner.startDate)}</span>
                                  </div>
                                  {owner.endDate ? (
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-600 font-medium">To:</span>
                                      <span className="font-medium">{formatDate(owner.endDate)}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-4 h-4 text-green-500" />
                                      <span className="text-green-600 font-medium">Ongoing</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Transfer ID (if applicable) */}
                              {owner.transferId && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-600 font-medium">Transfer ID:</span>
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
                            <div className="flex flex-col space-y-2 ml-4">
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
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Ownership Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {historyData.ownershipHistory.length}
                </div>
                <div className="text-sm text-blue-800 font-medium">Total Owners</div>
                <div className="text-xs text-blue-600 mt-1">Since registration</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {historyData.totalTransfers}
                </div>
                <div className="text-sm text-green-800 font-medium">Transfers Made</div>
                <div className="text-xs text-green-600 mt-1">Ownership changes</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-lg font-bold text-purple-600 mb-2 truncate">
                  {historyData.ownershipHistory.find(owner => owner.isCurrentOwner)?.ownerName || 'Unknown'}
                </div>
                <div className="text-sm text-purple-800 font-medium">Current Owner</div>
                <div className="text-xs text-purple-600 mt-1">Active ownership</div>
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