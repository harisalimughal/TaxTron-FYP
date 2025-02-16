import Web3 from "web3";

let web3;

if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.request({ method: "eth_requestAccounts" }); // Request accounts on load
} else {
  console.error("Please install MetaMask!");
}

export default web3;
