import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Bell,
  HelpCircle,
  Phone,
  LogOut,
  Car,
  Repeat,
  CreditCard,
  History,
  ArrowLeft,
} from "lucide-react";

const Dashboard = ({ account }) => {
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  const handleServiceSelection = (path) => {
    navigate(path, { state: { account } });
  };

  const handleNotificationsClick = () => {
    navigate("/notifications", { state: { account } });
  };

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/inspections/wallet/${account}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }
        );
        if (Array.isArray(res.data.data)) {
          setNotificationCount(res.data.data.length);
        }
      } catch (err) {
        console.error("Failed to fetch notification count:", err);
        setNotificationCount(0);
      }
    };

    if (account) {
      fetchNotificationCount();
    }
  }, [account]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-indigo-400">TaxTron</h1>
          <p className="text-gray-500 text-sm">Vehicle Services Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          <div>
            <div className="text-indigo-500 px-6 mb-2 uppercase text-sm font-semibold">
              Menu
            </div>

            <div className="space-y-1">
              <a
                href="#"
                className="flex items-center px-6 py-2 text-indigo-400 hover:bg-gray-800"
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </a>
              <button
                onClick={handleNotificationsClick}
                className="w-full flex items-center px-6 py-2 text-gray-400 hover:bg-gray-800 text-left"
              >
                <Bell className="w-5 h-5 mr-3" />
                Inspections
                <span className="ml-auto text-sm text-indigo-400 bg-gray-800 px-2 py-0.5 rounded-full">
                  {notificationCount}
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-gray-400 px-6 mb-2 uppercase text-sm font-semibold">
              Settings
            </div>

            <div className="space-y-1">
              <a
                href="#"
                className="flex items-center px-6 py-2 text-gray-400 hover:bg-gray-800"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                FAQ's
              </a>
              <a
                href="#"
                className="flex items-center px-6 py-2 text-gray-400 hover:bg-gray-800"
              >
                <Phone className="w-5 h-5 mr-3" />
                Contact Us
              </a>
              <a
                href="#"
                className="flex items-center px-6 py-2 text-gray-400 hover:bg-gray-800"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-gray-400 text-lg">Welcome to Dashboard</h2>
          <div className="flex items-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md">
              {account
                ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}`
                : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-indigo-400 hover:text-indigo-300"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="inline w-5 h-5 mr-1" />
              Back
            </button>
          </div>
        </div>

        <div className="text-center mb-14">
          <h2 className="text-3xl font-semibold text-white mb-2">
            Pick a service to continue
          </h2>
          <p className="text-gray-400">Select one of the services below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Service Card */}
          <div
            onClick={() => handleServiceSelection("/register")}
            className="cursor-pointer bg-gray-800 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <div className="flex items-center space-x-4 mb-5">
              <div className="bg-indigo-500/10 p-4 rounded-xl">
                <Car className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Vehicle Registration
              </h3>
            </div>
            <p className="text-gray-400 text-md">
              Register your vehicle with blockchain-backed security.
            </p>
          </div>

          <div
            onClick={() => handleServiceSelection("/transfer")}
            className="cursor-pointer bg-gray-800 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <div className="flex items-center space-x-4 mb-5">
              <div className="bg-indigo-500/10 p-4 rounded-xl">
                <Repeat className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Ownership Transfer
              </h3>
            </div>
            <p className="text-gray-400 text-md">
              Transfer vehicle ownership securely and easily.
            </p>
          </div>

          <div
            onClick={() => handleServiceSelection("/tax-payment")}
            className="cursor-pointer bg-gray-800 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <div className="flex items-center space-x-4 mb-5">
              <div className="bg-indigo-500/10 p-4 rounded-xl">
                <CreditCard className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Tax Payment
              </h3>
            </div>
            <p className="text-gray-400 text-md">
              Pay taxes and stay compliant with one click.
            </p>
          </div>

          <div
            onClick={() => handleServiceSelection("/history")}
            className="cursor-pointer bg-gray-800 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <div className="flex items-center space-x-4 mb-5">
              <div className="bg-indigo-500/10 p-4 rounded-xl">
                <History className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Ownership History
              </h3>
            </div>
            <p className="text-gray-400 text-md">
              Check complete history of your registered vehicle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
