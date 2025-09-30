import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaxTronLogo from "./TaxTronLogo";
import Navigation from "./Navigation";
import {
  ArrowLeft,
  Car,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Award,
  DollarSign,
  Shield,
  CreditCard,
  Clock,
  LogOut
} from "lucide-react";

const MyVehicles = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [navigating, setNavigating] = useState(false);

  const toggleCardExpansion = (vehicleId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      // Fetch vehicles for tax payment (approved vehicles)
      const vehiclesResponse = await axios.get('http://localhost:5000/api/vehicles/tax-payment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (vehiclesResponse.data.success) {
        setVehicles(vehiclesResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="h-16 rounded-2xl bg-white/60 backdrop-blur border border-gray-200/60"></div>
            {/* List skeleton */}
            <div className="space-y-4">
              <div className="h-24 bg-white rounded-xl border border-gray-100"></div>
              <div className="h-24 bg-white rounded-xl border border-gray-100"></div>
              <div className="h-24 bg-white rounded-xl border border-gray-100"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="flex">
        {/* Navigation */}
        <Navigation user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white/60 backdrop-blur border-b border-gray-200/60 supports-[backdrop-filter]:bg-white/60">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
                    <p className="text-sm text-gray-600">Manage all your registered vehicles</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={fetchVehicles}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                    title="Refresh data"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {/* Vehicles List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">All Vehicles</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
              
              {vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles.map((vehicle, index) => {
                    const isExpanded = expandedCards.has(vehicle.inspectionId);
                    return (
                      <div key={index} className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-all overflow-hidden shadow-soft hover:shadow-softLg hover:-translate-y-0.5">
                        {/* Main Card Content */}
                        <div className="p-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleCardExpansion(vehicle.inspectionId)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-500 ring-1 ring-brand-300/40 shadow-md">
                                <Car className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</h4>
                                <p className="text-sm text-gray-600">{vehicle.registrationNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                            {/* Tax Paid Status - Left of NFT Button */}
                            {vehicle.registrationFeePaid && vehicle.taxPaid && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                                Tax Paid
                              </span>
                            )}
                            {/* Registration Fee Button */}
                            {vehicle.registrationFeePaid ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/view-nft/${vehicle.inspectionId}`);
                                }}
                                className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                              >
                                <Award className="w-3 h-3 mr-1" />
                                NFT
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/pay-fee/${vehicle.inspectionId}`);
                                }}
                                className="bg-brand-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors flex items-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Pay Fee
                              </button>
                            )}
                            
                            {/* Tax Payment Button - Only show Pay Tax button, Tax Paid is in top right */}
                            {vehicle.registrationFeePaid && !vehicle.taxPaid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/tax-payment');
                                }}
                                className="bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Pay Tax
                              </button>
                            )}
                            
                            {/* Ownership History Button */}
                            {vehicle.registrationFeePaid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/ownership-history/${vehicle.inspectionId}`);
                                }}
                                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                History
                              </button>
                            )}
                            
                            {/* Ownership Transfer Button */}
                            {vehicle.registrationFeePaid && vehicle.taxPaid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/ownership-transfer');
                                }}
                                className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors flex items-center"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Transfer
                              </button>
                            )}
                            
                            <button 
                              className="p-2 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add menu functionality here if needed
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardExpansion(vehicle.inspectionId);
                              }}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <h5 className="font-medium text-gray-900 text-sm">Vehicle Details</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Year:</span>
                                    <span className="font-medium">{vehicle.year || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Chassis:</span>
                                    <span className="font-medium">{vehicle.chassisNumber || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Engine:</span>
                                    <span className="font-medium">{vehicle.engineCapacity ? `${vehicle.engineCapacity}cc` : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Color:</span>
                                    <span className="font-medium">{vehicle.color || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="font-medium text-gray-900 text-sm">Registration Status</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${vehicle.registrationFeePaid ? 'text-green-600' : 'text-orange-600'}`}>
                                      {vehicle.registrationFeePaid ? 'Registration Complete' : 'Pending Payment'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Registration Fee:</span>
                                    <span className="font-medium">PKR {vehicle.taxAmount || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Submitted:</span>
                                    <span className="font-medium">
                                      {new Date(vehicle.registrationTimestamp * 1000).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {vehicle.registrationFeePaid && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Paid On:</span>
                                      <span className="font-medium text-green-600">
                                        {new Date(vehicle.taxPaidTimestamp * 1000).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {vehicle.inspectionNotes && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h5 className="font-medium text-gray-900 text-sm mb-2">Inspection Notes</h5>
                                <p className="text-sm text-gray-600">{vehicle.inspectionNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No vehicles registered yet</p>
                  <button
                    onClick={() => {
                      setNavigating(true);
                      setTimeout(() => navigate('/vehicle/register'), 500);
                    }}
                    className="px-6 py-3 bg-brand-500 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 hover:bg-brand-600 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    Register Your First Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Loader Overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading registration form...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVehicles;
