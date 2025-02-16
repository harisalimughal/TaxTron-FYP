import React, { useEffect, useState } from "react";
import contract from "../utils/contract";

const ViewVehicles = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const total = await contract.methods.totalVehicles().call();
      let vehicleList = [];
      for (let i = 0; i < total; i++) {
        const vehicle = await contract.methods.getVehicle(i).call();
        vehicleList.push(vehicle);
      }
      setVehicles(vehicleList);
    };

    fetchVehicles();
  }, []);

  return (
    <div>
      <h2>Registered Vehicles</h2>
      <ul>
        {vehicles.map((v, index) => (
          <li key={index}>{v}</li>
        ))}
      </ul>
    </div>
  );
};

export default ViewVehicles;
