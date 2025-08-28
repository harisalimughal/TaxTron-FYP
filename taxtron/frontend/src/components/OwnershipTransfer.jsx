"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const OwnershipTransfer = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transferId, setTransferId] = useState("")
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [account, setAccount] = useState("")

  const [transferData, setTransferData] = useState({
    // Current Owner Details
    currentOwnerName: "",
    currentOwnerCnic: "",
    currentOwnerAddress: "",

    // New Owner Details
    newOwnerName: "",
    newOwnerCnic: "",
    newOwnerAddress: "",
    newOwnerPhone: "",

    // Vehicle Details
    registrationNumber: "",
    engineNumber: "",
    chassisNumber: "",
    make: "",
    model: "",
    year: "",

    // Transfer Details
    transferType: "",
    transferReason: "",
    salePrice: "",
    transferDate: "",

    // Documents
    hasNOC: false,
    hasClearance: false,
    hasInsurance: false,
    hasTransferCertificate: false,
  })

  // Generate a unique transfer ID when component mounts
  useEffect(() => {
    const uniqueId = `TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    setTransferId(uniqueId)
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === "currentOwnerCnic" || name === "newOwnerCnic") {
      // Allow only numbers and limit to exactly 13 digits
      if (!/^\d*$/.test(value)) return
      if (value.length > 13) return
    } else if (name === "currentOwnerName" || name === "newOwnerName") {
      // Allow only alphabets and spaces
      if (!/^[a-zA-Z\s]*$/.test(value)) return
    } else if (name === "newOwnerPhone") {
      // Allow only numbers and limit to 11 digits
      if (!/^\d*$/.test(value)) return
      if (value.length > 11) return
    } else if (name === "salePrice") {
      // Allow only numbers
      if (!/^\d*$/.test(value)) return
    }

    setTransferData({
      ...transferData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setAccount(accounts[0])
        return accounts[0]
      } catch (error) {
        console.error("Error connecting to MetaMask", error)
        alert("Error connecting to MetaMask: " + error.message)
      }
    } else {
      alert("Please install MetaMask to use this feature!")
    }
  }

  const submitTransferRequest = async () => {
    let currentAccount = account

    if (!currentAccount) {
      currentAccount = await connectWallet()
      if (!currentAccount) {
        alert("Please connect MetaMask first!")
        return
      }
    }

    // Validate CNIC lengths
    if (transferData.currentOwnerCnic.length !== 13) {
      alert("Current owner CNIC must be exactly 13 digits!")
      return
    }

    if (transferData.newOwnerCnic.length !== 13) {
      alert("New owner CNIC must be exactly 13 digits!")
      return
    }

    // Validate phone number
    if (transferData.newOwnerPhone.length !== 11) {
      alert("Phone number must be exactly 11 digits!")
      return
    }

    // Check required documents
    const requiredDocs = [
      transferData.hasNOC,
      transferData.hasClearance,
      transferData.hasInsurance,
      transferData.hasTransferCertificate,
    ]

    if (!requiredDocs.every((doc) => doc)) {
      alert("Please confirm that you have all required documents!")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare the transfer data
      const transferRequestData = {
        transferId: transferId,
        walletAddress: currentAccount,
        currentOwner: {
          name: transferData.currentOwnerName,
          cnic: transferData.currentOwnerCnic,
          address: transferData.currentOwnerAddress,
        },
        newOwner: {
          name: transferData.newOwnerName,
          cnic: transferData.newOwnerCnic,
          address: transferData.newOwnerAddress,
          phone: transferData.newOwnerPhone,
        },
        vehicleDetails: {
          registrationNumber: transferData.registrationNumber,
          engineNumber: transferData.engineNumber,
          chassisNumber: transferData.chassisNumber,
          make: transferData.make,
          model: transferData.model,
          year: Number.parseInt(transferData.year) || 0,
        },
        transferDetails: {
          type: transferData.transferType,
          reason: transferData.transferReason,
          salePrice: transferData.salePrice ? Number.parseInt(transferData.salePrice) : 0,
          transferDate: transferData.transferDate,
        },
        documents: {
          noc: transferData.hasNOC,
          clearance: transferData.hasClearance,
          insurance: transferData.hasInsurance,
          transferCertificate: transferData.hasTransferCertificate,
        },
      }

      // Simulate API call - replace with actual endpoint
      console.log("Transfer request submitted:", transferRequestData)

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setTransferSuccess(true)

      alert(
        `Ownership transfer request submitted successfully! Your transfer ID is ${transferId}. Please save this ID for reference. The transfer will be processed within 5-7 business days.`,
      )
    } catch (error) {
      console.error("Error submitting transfer request:", error)
      alert("Error submitting transfer request: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate year options for dropdown
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year)
    }
    return years
  }

  const yearOptions = generateYearOptions()

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Vehicle Ownership Transfer</h2>
          <div className="flex items-center">
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              {account ? `Connected: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
              onClick={() => navigate("/dashboard")}
            >
              &lt; Back to Dashboard
            </button>
          </div>
        </div>

        {transferId && (
          <div className="mb-6 bg-blue-900/30 border border-blue-600 rounded-md p-3">
            <p className="text-blue-300 font-medium">
              Your Transfer ID: <span className="text-white font-bold">{transferId}</span>
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Please save this ID for future reference. You'll need it to track your transfer status.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Current Owner & Vehicle Details */}
          <div className="space-y-6">
            {/* Current Owner Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Owner Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Owner Name *</label>
                  <input
                    type="text"
                    name="currentOwnerName"
                    value={transferData.currentOwnerName}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Owner CNIC (13 digits) *</label>
                  <input
                    type="text"
                    name="currentOwnerCnic"
                    value={transferData.currentOwnerCnic}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    placeholder="1234567890123"
                    maxLength="13"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transferData.currentOwnerCnic.length}/13 digits
                    {transferData.currentOwnerCnic.length > 0 && transferData.currentOwnerCnic.length !== 13 && (
                      <span className="text-red-400 ml-2">Must be exactly 13 digits</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Owner Address *</label>
                  <textarea
                    name="currentOwnerAddress"
                    value={transferData.currentOwnerAddress}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white resize-none"
                    rows="3"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={transferData.registrationNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Engine Number *</label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={transferData.engineNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Chassis Number *</label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={transferData.chassisNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Make *</label>
                    <input
                      type="text"
                      name="make"
                      value={transferData.make}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={transferData.model}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Year *</label>
                  <div className="relative">
                    <select
                      name="year"
                      value={transferData.year}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none"
                      required
                    >
                      <option value="">Select year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year} className="bg-gray-800 text-white">
                          {year}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                        <path
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - New Owner & Transfer Details */}
          <div className="space-y-6">
            {/* New Owner Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">New Owner Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Owner Name *</label>
                  <input
                    type="text"
                    name="newOwnerName"
                    value={transferData.newOwnerName}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Owner CNIC (13 digits) *</label>
                  <input
                    type="text"
                    name="newOwnerCnic"
                    value={transferData.newOwnerCnic}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    placeholder="1234567890123"
                    maxLength="13"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transferData.newOwnerCnic.length}/13 digits
                    {transferData.newOwnerCnic.length > 0 && transferData.newOwnerCnic.length !== 13 && (
                      <span className="text-red-400 ml-2">Must be exactly 13 digits</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Owner Address *</label>
                  <textarea
                    name="newOwnerAddress"
                    value={transferData.newOwnerAddress}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white resize-none"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Owner Phone (11 digits) *</label>
                  <input
                    type="text"
                    name="newOwnerPhone"
                    value={transferData.newOwnerPhone}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    placeholder="03001234567"
                    maxLength="11"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transferData.newOwnerPhone.length}/11 digits
                    {transferData.newOwnerPhone.length > 0 && transferData.newOwnerPhone.length !== 11 && (
                      <span className="text-red-400 ml-2">Must be exactly 11 digits</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Transfer Type *</label>
                  <div className="relative">
                    <select
                      name="transferType"
                      value={transferData.transferType}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none"
                      required
                    >
                      <option value="">Select transfer type</option>
                      <option value="sale">Sale</option>
                      <option value="gift">Gift</option>
                      <option value="inheritance">Inheritance</option>
                      <option value="court_order">Court Order</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                        <path
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Transfer Reason *</label>
                  <textarea
                    name="transferReason"
                    value={transferData.transferReason}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white resize-none"
                    rows="2"
                    placeholder="Brief reason for transfer"
                    required
                  />
                </div>

                {transferData.transferType === "sale" && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sale Price (PKR) *</label>
                    <input
                      type="text"
                      name="salePrice"
                      value={transferData.salePrice}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                      placeholder="Enter sale price"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    name="transferDate"
                    value={transferData.transferDate}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Required Documents Checklist</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasNOC"
                    checked={transferData.hasNOC}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">No Objection Certificate (NOC) *</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasClearance"
                    checked={transferData.hasClearance}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Tax Clearance Certificate *</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasInsurance"
                    checked={transferData.hasInsurance}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Valid Insurance Certificate *</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasTransferCertificate"
                    checked={transferData.hasTransferCertificate}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Transfer Certificate *</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={submitTransferRequest}
            disabled={isSubmitting || transferSuccess}
            className={`${
              isSubmitting || transferSuccess ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-10 py-2 rounded-md font-medium transition duration-200 w-64`}
          >
            {isSubmitting
              ? "Processing..."
              : transferSuccess
                ? "Transfer Request Submitted ✔️"
                : "Submit Transfer Request"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <a href={"/dashboard"} className="inline-block text-sm text-blue-400 hover:underline">
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}

export default OwnershipTransfer
