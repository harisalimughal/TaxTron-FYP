// import React from "react";
// import { useNavigate } from "react-router-dom";

// const Dashboard = ({ account }) => {
//   const navigate = useNavigate();

//   return (
//     <div>
//       <h1>Welcome to Dashboard</h1>
//       <p>Connected Account: {account}</p>
//       <button onClick={() => navigate("/register", { state: { account } })}>
//         Register Vehicle
//       </button>
//     </div>
//   );
// };

// export default Dashboard;


import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ account }) => {
  const navigate = useNavigate();

  const handleServiceSelection = (path) => {
    navigate(path, { state: { account } });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-indigo-400">TaxTron</h1>
          
    
        </div>
        
        <div className="mt-6">
          <div className="text-indigo-500 px-4 py-2">Menu</div>
          
          <div className="mt-2">
            <a href="#" className="flex items-center px-4 py-2 text-indigo-400 hover:bg-gray-800">
              <span className="mr-2">◻</span>
              <span>Home</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800">
              <span className="mr-2">◯</span>
              <span>Notifications (2)</span>
            </a>
          </div>
          
          <div className="mt-6">
            <div className="text-gray-400 px-4 py-2">Settings</div>
            
            <div className="mt-2">
              <a href="#" className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800">
                <span className="mr-2">◻</span>
                <span>FAQ's</span>
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800">
                <span className="mr-2">◻</span>
                <span>Contact us</span>
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-800">
                <span className="mr-2">◻</span>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8 ">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-gray-400">Welcome to Dashboard</h2>
          <div className="flex items-center">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              {account ? `Connected Account: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
              onClick={() => window.history.back()}
            >
              &lt; Back
            </button>
          </div>
          
        </div>
        <div><h2 className="text-xl font-semibold mb-8 text-center">Pick a service to continue</h2> </div>
        
        <div className=" ml-16">

        <div className="grid grid-cols-2 gap-6 max-w-3xl">
          {/* Vehicle Registration Card */}
          <div 
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-indigo-500/30 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
            onClick={() => handleServiceSelection("/register")}
          >
            <div className="h-16 w-16 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17l3-2.94m0 0l3 2.94M12 14.06V3.5M16 20H8a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Vehicle Registration</h3>
          </div>
          
          {/* Ownership Transfer Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-indigo-500/30 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Ownership Transfer</h3>
          </div>
          
          {/* Tax Payment Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-indigo-500/30 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Tax Payment</h3>
          </div>
          
          {/* Ownership History Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-indigo-500/30 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
            <div className="h-16 w-16 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Ownership History</h3>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
