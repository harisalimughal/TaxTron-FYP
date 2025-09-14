import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import TaxTronLogo from "./TaxTronLogo";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, default to admin dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store the admin token
        localStorage.setItem('adminToken', data.token);
        login();
        navigate(from, { replace: true });
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center">
      <div className="mb-16">
        <TaxTronLogo size="4xl" showText={false} />
      </div>
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-green-200">
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Admin Login
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full text-white font-semibold py-3 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{backgroundColor: '#8CC152'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;