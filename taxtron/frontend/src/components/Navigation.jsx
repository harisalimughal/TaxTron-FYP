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
  const navigate = useNavigate();

  const menuItems = [
    { icon: Plus, label: 'Register Vehicle', path: '/vehicle/register', color: 'bg-green-500' },
    { icon: CreditCard, label: 'Pay Tax', path: '/tax-payment', color: 'bg-blue-500' },
    { icon: History, label: 'View History', path: '/ownership-history', color: 'bg-purple-500' },
    { icon: ArrowRightLeft, label: 'Ownership Transfer', path: '/ownership-transfer', color: 'bg-orange-500' },
    { icon: SearchCheck, label: 'Inspections', path: '/inspections', color: 'bg-teal-500' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200 text-center">
            <div className="flex justify-center">
              <TaxTronLogo size="4xl" showText={false} />
            </div>
            <p className="text-gray-500 text-sm mt-2">TaxTron</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.color ? item.color : 'bg-gray-100'
                } group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navigation;
