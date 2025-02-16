import React, { useEffect, useState } from "react";
import contract from "./utils/contract";
import web3 from "./utils/web3";
import MetaMaskLogin from "./components/MetaMaskLogin";
import RegisterVehicle from "./components/RegisterVehicle";
import ViewVehicle from "./components/ViewVehicle";

const App = () => {
  const [account, setAccount] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]); // Save the user's MetaMask address
    };

    loadAccount();
  }, []);

  return (
    <div>
      <h1>Connected Account: {account}</h1>
      <MetaMaskLogin setAccount={setAccount} />
      <RegisterVehicle account={account} />
      <ViewVehicle />
    </div>
  );
};

export default App;
