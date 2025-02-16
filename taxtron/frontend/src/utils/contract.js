import web3 from "./web3";
import contractConfig from "../contractConfig"; // Ensure this file contains the ABI & contract address

const contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);

export default contract; 
