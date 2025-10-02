import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaxTronLogo from './TaxTronLogo';
import {
  CreditCard,
  CheckCheck,
  History,
  ArrowRightLeft,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  SearchCheck
} from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { icon: Plus, label: 'Register Vehicle', path: '/vehicle/register', color: 'bg-green-500' },
    { icon: CreditCard, label: 'Pay Tax', path: '/tax-payment', color: 'bg-blue-500' },
    { icon: ArrowRightLeft, label: 'Ownership Transfer', path: '/ownership-transfer', color: 'bg-orange-500' },
    { icon: History, label: 'Ownership History', path: '/ownership-history', color: 'bg-purple-500' },
    { icon: SearchCheck, label: 'Inspections', path: '/inspections', color: 'bg-teal-500' },
  ];

  const handleNavigation = (path) => {
    if (path === '/vehicle/register') {
      setNavigating(true);
      setTimeout(() => {
        navigate(path);
        setIsMobileMenuOpen(false);
      }, 500);
    } else {
      navigate(path);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-blue-50 via-slate-50 to-gray-100 shadow-[4px_4px_12px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.9)] transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-slate-200 text-center">
            <div className="flex justify-center">
              <TaxTronLogo size="4xl" showText={false} />
            </div>
            <p className="text-gray-500 text-sm mt-2">TaxTron</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-left transition-all duration-300 text-slate-700 hover:text-slate-800 group bg-slate-50 hover:bg-slate-100 shadow-[8px_8px_16px_rgba(163,163,163,0.4),-8px_-8px_16px_rgba(255,255,255,1)] hover:shadow-[12px_12px_24px_rgba(163,163,163,0.6),-12px_-12px_24px_rgba(255,255,255,1)] hover:scale-[1.02] active:shadow-[inset_4px_4px_8px_rgba(163,163,163,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.color ? item.color : 'bg-gray-300'
                } transition-all duration-300 shadow-[3px_3px_6px_rgba(0,0,0,0.2),-3px_-3px_6px_rgba(255,255,255,0.8)] group-hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-2px_-2px_4px_rgba(255,255,255,0.9)] group-hover:scale-105`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Navigation Loader Overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading registration form...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
