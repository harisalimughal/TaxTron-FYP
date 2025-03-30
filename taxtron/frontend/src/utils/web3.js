import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && window.ethereum) {
  web3 = new Web3(window.ethereum);
  try {
    window.ethereum.request({ method: "eth_requestAccounts" }); // Request account access
  } catch (error) {
    console.error("User denied account access");
  }
} else {
  console.error("MetaMask is not installed!");
}

export default web3;
