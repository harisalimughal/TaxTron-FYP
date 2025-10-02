import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaxTronLogo from "./TaxTronLogo";
import AIChatSupport from "./AIChatSupport";
import Navigation from "./Navigation";
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
  Shield,
  ArrowRight
} from "lucide-react";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  // Derived analytics
  const taxPaidCount = vehicles.filter(v => v.registrationFeePaid && v.taxPaid).length;
  const taxDueCount = vehicles.filter(v => v.registrationFeePaid && !v.taxPaid).length;
  
  // Charts: datasets & options
  const barData = {
    labels: ['Total Vehicles', 'Pending', 'Tax Due'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalVehicles, stats.pendingInspections, stats.taxDue],
        backgroundColor: ['#8CC152', 'rgba(234, 88, 12, 0.9)', 'rgba(239, 68, 68, 0.9)'],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { precision: 0, stepSize: 1 } },
    },
  };

  const donutData = {
    labels: ['Tax Paid', 'Tax Due'],
    datasets: [
      {
        data: [taxPaidCount, taxDueCount],
        backgroundColor: ['#16a34a', '#f97316'],
        hoverBackgroundColor: ['#15803d', '#ea580c'],
        borderWidth: 0,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '65%',
  };
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

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
        
        // Calculate tax due from approved vehicles that have paid registration fee but not tax
        const taxDue = vehiclesResponse.data.data.filter(v => v.registrationFeePaid && !v.taxPaid).length;
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
    setNavigating(true);
    // Add a small delay to show the loader
    setTimeout(() => {
      navigate('/vehicle/register', { state: { prefillData: registrationData } });
    }, 500);
  };

  const handleNavigateToRegister = () => {
    setNavigating(true);
    setTimeout(() => {
      navigate('/vehicle/register');
    }, 500);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="h-16 rounded-2xl bg-white/60 backdrop-blur border border-gray-200/60"></div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-28 bg-white rounded-2xl border border-gray-100"></div>
              <div className="h-28 bg-white rounded-2xl border border-gray-100"></div>
              <div className="h-28 bg-white rounded-2xl border border-gray-100"></div>
            </div>
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
      <div className="flex h-screen">
        {/* Navigation */}
        <Navigation user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white/60 backdrop-blur border-b border-gray-200/60 supports-[backdrop-filter]:bg-white/60">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600">Welcome back, {user?.fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                    <Bell className="w-6 h-6" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                    <Search className="w-6 h-6" />
                  </button>
                  
                  {/* Profile Dropdown */}
                  <div className="relative profile-dropdown">
                    <button 
                      onClick={toggleProfileDropdown}
                      className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full hover:scale-105 transition-transform cursor-pointer ring-1 ring-brand-300/40 shadow-soft"
                    >
                      <span className="text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-xl shadow-softLg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-b-xl"
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

          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-softLg transition-all hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVehicles}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-500 ring-1 ring-brand-300/40 shadow-md">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-softLg transition-all hover:-translate-y-0.5">
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

              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-softLg transition-all hover:-translate-y-0.5">
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

            {/* My Vehicles Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-500 ring-1 ring-brand-300/40 shadow-md">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Vehicles</h3>
                    <p className="text-sm text-gray-600">
                      {vehicles.length > 0 
                        ? `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} registered`
                        : 'Manage your registered vehicles'
                      }
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/vehicles')}
                  className="bg-brand-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-all duration-200 transform hover:scale-105 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 flex items-center space-x-2"
                >
                  <Car className="w-4 h-4" />
                  <span>View All Vehicles</span>
                </button>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                </div>
                <div className="h-64">
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>

              {/* Doughnut Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tax Status</h3>
                </div>
                <div className="h-64">
                  <Doughnut data={donutData} options={donutOptions} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
                    <span className="text-gray-600">Paid</span>
                    <span className="ml-auto font-semibold text-gray-900">{taxPaidCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-gray-600">Due</span>
                    <span className="ml-auto font-semibold text-gray-900">{taxDueCount}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* Quick Actions for Approved Vehicles - Payment Required */}
            {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length > 0 && (
              <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-2xl p-6 border border-brand-200 mb-8 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Fee Pending</h3>
                    <p className="text-sm text-gray-600">
                      You have {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length} approved vehicle(s) waiting for registration fee payment.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).slice(0, 2).map((vehicle, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/pay-fee/${vehicle.inspectionId}`)}
                        className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay {vehicle.make} {vehicle.model}
                      </button>
                    ))}
                    {vehicles.filter(v => v.registrationNumber === 'Pending' && !v.registrationFeePaid).length > 2 && (
                      <button
                        onClick={() => navigate('/inspections')}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium"
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
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 mb-8 shadow-soft">
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
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay Annual Tax
                    </button>
                  </div>
                </div>
              </div>
            )}


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

export default Dashboard;