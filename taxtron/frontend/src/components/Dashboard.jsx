import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ account }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      <p>Connected Account: {account}</p>
      <button onClick={() => navigate("/register", { state: { account } })}>
        Register Vehicle
      </button>
    </div>
  );
};

export default Dashboard;
