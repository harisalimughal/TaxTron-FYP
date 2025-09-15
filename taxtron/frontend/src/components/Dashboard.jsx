import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaxTronLogo from "./TaxTronLogo";
import Navigation from "./Navigation";
import AIChatSupport from "./AIChatSupport";
import {
  Bell,
  Search,
  User,
  Car,
  MoreVertical,
  AlertCircle,
  Clock,
  LogOut,
  MessageCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Award,
  DollarSign,
  Shield
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    pendingInspections: 0,
    taxDue: 0
  });
  const [expandedCards, setExpandedCards] = useState(new Set());

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
    fetchDashboardData();
  }, []);

  // Refresh data when user returns to the dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      fetchDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      // Fetch vehicles for tax payment (approved vehicles)
      const vehiclesResponse = await axios.get('http://localhost:5000/api/vehicles/tax-payment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch user's inspections to get accurate pending count
      const inspectionsResponse = await axios.get('http://localhost:5000/api/vehicles/my-vehicles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (vehiclesResponse.data.success) {
        // Debug: Log the vehicle data to check structure
        console.log('Dashboard vehicle data:', vehiclesResponse.data.data);
        if (vehiclesResponse.data.data.length > 0) {
          console.log('First vehicle structure:', vehiclesResponse.data.data[0]);
        }
        
        setVehicles(vehiclesResponse.data.data);
        
        // Calculate stats using correct data sources
        const totalVehicles = vehiclesResponse.data.data.length;
        
        // Get actual pending inspections (status = 'Pending')
        const pendingInspections = inspectionsResponse.data.success ? 
          inspectionsResponse.data.data.filter(i => i.status === 'Pending').length : 0;
        
        // Calculate tax due from approved vehicles
        const taxDue = vehiclesResponse.data.data.filter(v => v.taxStatus === 'Due').length;
        
        setStats({
          totalVehicles,
          pendingInspections,
          taxDue
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setShowProfileDropdown(false);
    navigate('/');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const toggleAIChat = () => {
    setShowAIChat(!showAIChat);
  };

  const handleStartRegistration = (registrationData) => {
    // Navigate to vehicle registration with pre-filled data
    navigate('/vehicle/register', { state: { prefillData: registrationData } });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#8CC152'}}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="flex">
        {/* Navigation */}
        <Navigation user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600">Welcome back, {user?.fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell className="w-6 h-6" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Search className="w-6 h-6" />
                  </button>
                  
                  {/* Profile Dropdown */}
                  <div className="relative profile-dropdown">
                    <button 
                      onClick={toggleProfileDropdown}
                      className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full hover:scale-105 transition-transform cursor-pointer"
                    >
                      <span className="text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVehicles}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                    <Car className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Inspections</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingInspections}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tax Due</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.taxDue}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions for Approved Vehicles - Payment Required */}
            {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Required</h3>
                    <p className="text-sm text-gray-600">
                      You have {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length} approved vehicle(s) waiting for registration fee payment.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).slice(0, 2).map((vehicle, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/pay-fee/${vehicle.inspectionId}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay {vehicle.make} {vehicle.model}
                      </button>
                    ))}
                    {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length > 2 && (
                      <button
                        onClick={() => navigate('/inspections')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View All ({vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length - 2} more)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions for Tax Payments */}
            {vehicles.filter(v => v.registrationFeePaid && !v.taxPaid).length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Annual Tax Due</h3>
                    <p className="text-sm text-gray-600">
                      You have {vehicles.filter(v => v.registrationFeePaid && !v.taxPaid).length} vehicle(s) with annual tax due for {new Date().getFullYear()}.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate('/tax-payment')}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay Annual Tax
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8">
              {/* Recent Vehicles */}
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">My Vehicles</h3>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={fetchDashboardData}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                        title="Refresh data"
                      >
                        Refresh
                      </button>
                      <button className="text-sm font-medium" style={{color: '#8CC152'}}>
                        View All
                      </button>
                    </div>
                  </div>
                  
                  {vehicles.length > 0 ? (
                    <div className="space-y-4">
                      {vehicles.slice(0, 3).map((vehicle, index) => {
                        const isExpanded = expandedCards.has(vehicle.inspectionId);
                        return (
                          <div key={index} className="rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors overflow-hidden">
                            {/* Main Card Content */}
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer"
                              onClick={() => toggleCardExpansion(vehicle.inspectionId)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#8CC152'}}>
                                  <Car className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</h4>
                                  <p className="text-sm text-gray-600">{vehicle.registrationNumber}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {/* Registration Fee Button */}
                                {vehicle.registrationFeePaid ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/view-nft/${vehicle.inspectionId}`);
                                    }}
                                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center"
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
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center"
                                  >
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    Pay Fee
                                  </button>
                                )}
                                
                                {/* Tax Payment Button */}
                                {vehicle.registrationFeePaid && (
                                  vehicle.taxPaid ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Could navigate to tax certificate or details
                                      }}
                                      className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200"
                                    >
                                      Tax Paid
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/tax-payment');
                                      }}
                                      className="bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex items-center"
                                    >
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Pay Tax
                                    </button>
                                  )
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
                        onClick={() => navigate('/vehicle/register')}
                        className="px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                        style={{backgroundColor: '#8CC152'}}
                      >
                        Register Your First Vehicle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI Chat Support - Always visible */}
      <AIChatSupport
        isOpen={true}
        onClose={() => {}}
        account={user?.walletAddress}
        onStartRegistration={handleStartRegistration}
      />
    </div>
  );
};

export default Dashboard;
