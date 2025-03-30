const VehicleRegistry = artifacts.require("VehicleRegistry");

contract("VehicleRegistry", accounts => {
  const owner = accounts[0];
  const buyer1 = accounts[1];
  const buyer2 = accounts[2];
  
  let vehicleRegistry;
  
  // Sample vehicle data
  const vehicle1 = {
    ownerName: "John Doe",
    fatherName: "Robert Doe",
    cnic: "12345-1234567-1",
    registrationNumber: "ABC-123",
    engineNumber: "ENG12345",
    chassisNumber: "CHS12345",
    make: "Toyota",
    model: "Corolla",
    variant: "GLI",
    manufacturingYear: 2020,
    registrationYear: 2021,
    vehicleType: "Sedan",
    fuelType: "Petrol"
  };
  
  const vehicle2 = {
    ownerName: "Jane Smith",
    fatherName: "William Smith",
    cnic: "98765-7654321-9",
    registrationNumber: "XYZ-789",
    engineNumber: "ENG98765",
    chassisNumber: "CHS98765",
    make: "Honda",
    model: "Civic",
    variant: "Turbo",
    manufacturingYear: 2022,
    registrationYear: 2023,
    vehicleType: "Sedan",
    fuelType: "Hybrid"
  };
  
  before(async () => {
    vehicleRegistry = await VehicleRegistry.deployed();
  });
  
  describe("Vehicle Registration", () => {
    it("should register a vehicle with complete details", async () => {
      // Register first vehicle
      const result = await vehicleRegistry.registerVehicle(vehicle1, { from: owner });
      
      // Check events
      assert.equal(result.logs.length, 2, "Should emit two events");
      assert.equal(result.logs[0].event, "RegistrationAttempt", "Should emit RegistrationAttempt event");
      assert.equal(result.logs[1].event, "VehicleRegistered", "Should emit VehicleRegistered event");
      
      // Check event data
      assert.equal(result.logs[1].args.registrationNumber, vehicle1.registrationNumber, "Registration number in event doesn't match");
      assert.equal(result.logs[1].args.ownerWallet, owner, "Owner wallet in event doesn't match");
      
      // Get the vehicle data from the contract
      const registeredVehicle = await vehicleRegistry.vehicles(vehicle1.registrationNumber);
      
      // Verify all fields
      assert.equal(registeredVehicle.ownerWallet, owner, "Owner wallet doesn't match");
      assert.equal(registeredVehicle.ownerName, vehicle1.ownerName, "Owner name doesn't match");
      assert.equal(registeredVehicle.fatherName, vehicle1.fatherName, "Father name doesn't match");
      assert.equal(registeredVehicle.cnic, vehicle1.cnic, "CNIC doesn't match");
      assert.equal(registeredVehicle.registrationNumber, vehicle1.registrationNumber, "Registration number doesn't match");
      assert.equal(registeredVehicle.engineNumber, vehicle1.engineNumber, "Engine number doesn't match");
      assert.equal(registeredVehicle.chassisNumber, vehicle1.chassisNumber, "Chassis number doesn't match");
      assert.equal(registeredVehicle.make, vehicle1.make, "Make doesn't match");
      assert.equal(registeredVehicle.model, vehicle1.model, "Model doesn't match");
      assert.equal(registeredVehicle.variant, vehicle1.variant, "Variant doesn't match");
      assert.equal(registeredVehicle.manufacturingYear.toNumber(), vehicle1.manufacturingYear, "Manufacturing year doesn't match");
      assert.equal(registeredVehicle.registrationYear.toNumber(), vehicle1.registrationYear, "Registration year doesn't match");
      assert.equal(registeredVehicle.vehicleType, vehicle1.vehicleType, "Vehicle type doesn't match");
      assert.equal(registeredVehicle.fuelType, vehicle1.fuelType, "Fuel type doesn't match");
      assert.equal(registeredVehicle.isRegistered, true, "Vehicle should be marked as registered");
    });
    
    it("should reject registration with an existing registration number", async () => {
      // Create a vehicle with same registration number but different details
      const duplicateVehicle = {
        ...vehicle1,
        ownerName: "Different Owner",
        engineNumber: "DIFFERENT-ENGINE"
      };
      
      try {
        await vehicleRegistry.registerVehicle(duplicateVehicle, { from: buyer1 });
        assert.fail("Transaction should have reverted");
      } catch (error) {
        assert(
          error.message.includes("Vehicle already registered") || 
          error.message.includes("revert"),
          "Expected error message not received"
        );
      }
      
      // Verify original vehicle data is still intact
      const registeredVehicle = await vehicleRegistry.vehicles(vehicle1.registrationNumber);
      assert.equal(registeredVehicle.ownerName, vehicle1.ownerName, "Original owner name should remain unchanged");
      assert.equal(registeredVehicle.ownerWallet, owner, "Original owner wallet should remain unchanged");
    });
    
    it("should register a second vehicle with different registration number", async () => {
      // Register second vehicle from a different account
      const result = await vehicleRegistry.registerVehicle(vehicle2, { from: buyer1 });
      
      // Check events
      assert.equal(result.logs[1].event, "VehicleRegistered", "Should emit VehicleRegistered event");
      
      // Get the vehicle data from the contract
      const registeredVehicle = await vehicleRegistry.vehicles(vehicle2.registrationNumber);
      
      // Verify key fields
      assert.equal(registeredVehicle.ownerWallet, buyer1, "Owner wallet doesn't match for second vehicle");
      assert.equal(registeredVehicle.registrationNumber, vehicle2.registrationNumber, "Registration number doesn't match for second vehicle");
      assert.equal(registeredVehicle.isRegistered, true, "Second vehicle should be marked as registered");
    });
    
    it("should handle vehicles with minimum required data", async () => {
      // Vehicle with minimal data
      const minimalVehicle = {
        ownerName: "Minimal Owner",
        fatherName: "Minimal Father",
        cnic: "00000-0000000-0",
        registrationNumber: "MIN-001",
        engineNumber: "MIN-ENG",
        chassisNumber: "MIN-CHS",
        make: "Test",
        model: "Basic",
        variant: "Standard",
        manufacturingYear: 2015,
        registrationYear: 2015,
        vehicleType: "Compact",
        fuelType: "Petrol"
      };
      
      await vehicleRegistry.registerVehicle(minimalVehicle, { from: buyer2 });
      
      const registeredVehicle = await vehicleRegistry.vehicles(minimalVehicle.registrationNumber);
      assert.equal(registeredVehicle.ownerWallet, buyer2, "Owner wallet doesn't match for minimal vehicle");
      assert.equal(registeredVehicle.isRegistered, true, "Minimal vehicle should be registered");
    });
  });
  
  describe("Data Retrieval", () => {
    it("should retrieve correct data for all registered vehicles", async () => {
      // Check first vehicle
      const firstVehicle = await vehicleRegistry.vehicles(vehicle1.registrationNumber);
      assert.equal(firstVehicle.ownerName, vehicle1.ownerName, "Retrieved owner name should match for first vehicle");
      assert.equal(firstVehicle.make, vehicle1.make, "Retrieved make should match for first vehicle");
      
      // Check second vehicle
      const secondVehicle = await vehicleRegistry.vehicles(vehicle2.registrationNumber);
      assert.equal(secondVehicle.ownerName, vehicle2.ownerName, "Retrieved owner name should match for second vehicle");
      assert.equal(secondVehicle.make, vehicle2.make, "Retrieved make should match for second vehicle");
    });
    
    it("should return empty details for unregistered vehicles", async () => {
      const nonExistentVehicle = await vehicleRegistry.vehicles("NON-EXISTENT");
      assert.equal(nonExistentVehicle.isRegistered, false, "Non-existent vehicle should not be marked as registered");
      assert.equal(nonExistentVehicle.ownerName, "", "Non-existent vehicle should have empty owner name");
    });
  });
  
  describe("Ownership Verification", () => {
    it("should correctly track the owner wallet address", async () => {
      const firstVehicle = await vehicleRegistry.vehicles(vehicle1.registrationNumber);
      assert.equal(firstVehicle.ownerWallet, owner, "First vehicle should be owned by the owner account");
      
      const secondVehicle = await vehicleRegistry.vehicles(vehicle2.registrationNumber);
      assert.equal(secondVehicle.ownerWallet, buyer1, "Second vehicle should be owned by the buyer1 account");
    });
  });
});