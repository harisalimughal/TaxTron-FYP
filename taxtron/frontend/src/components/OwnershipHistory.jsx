"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const OwnershipHistory = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData = [
      {
        id: "VH001",
        vehicleId: "REG-2024-001",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        registrationNumber: "ABC-123",
        currentOwner: "John Doe",
        previousOwner: "Jane Smith",
        transferDate: "2024-01-15",
        transferType: "Sale",
        status: "Completed",
        documents: ["Transfer Certificate", "NOC", "Insurance"],
      },
      {
        id: "VH002",
        vehicleId: "REG-2024-002",
        make: "Honda",
        model: "Civic",
        year: 2019,
        registrationNumber: "XYZ-456",
        currentOwner: "Alice Johnson",
        previousOwner: "Bob Wilson",
        transferDate: "2024-02-20",
        transferType: "Gift",
        status: "Pending",
        documents: ["Transfer Certificate", "Gift Deed"],
      },
      {
        id: "VH003",
        vehicleId: "REG-2024-003",
        make: "Suzuki",
        model: "Alto",
        year: 2021,
        registrationNumber: "DEF-789",
        currentOwner: "Mike Brown",
        previousOwner: "Sarah Davis",
        transferDate: "2024-03-10",
        transferType: "Sale",
        status: "Completed",
        documents: ["Transfer Certificate", "NOC", "Insurance", "Tax Certificate"],
      },
    ]

    setTimeout(() => {
      setHistoryData(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredHistory = historyData.filter((item) => {
    const matchesSearch =
      item.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.currentOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.previousOwner.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || item.status.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-400 bg-green-900/50 border-green-500"
      case "pending":
        return "text-yellow-400 bg-yellow-900/50 border-yellow-500"
      case "rejected":
        return "text-red-400 bg-red-900/50 border-red-500"
      default:
        return "text-gray-400 bg-gray-900/50 border-gray-500"
    }
  }

  const getTransferTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "sale":
        return "text-blue-400 bg-blue-900/50"
      case "gift":
        return "text-purple-400 bg-purple-900/50"
      case "inheritance":
        return "text-orange-400 bg-orange-900/50"
      default:
        return "text-gray-400 bg-gray-900/50"
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading ownership history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ownership History</h2>
          <button
            className="text-blue-400 hover:text-blue-300 transition duration-200"
            onClick={() => navigate("/dashboard")}
          >
            &lt; Back to Dashboard
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-800 rounded-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by registration number, make, model, or owner name..."
                className="w-full bg-gray-700 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="bg-gray-700 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none min-w-[200px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
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

        {/* History Cards */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {item.make} {item.model} ({item.year})
                    </h3>
                    <p className="text-gray-400">Registration: {item.registrationNumber}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-md text-sm font-medium ${getTransferTypeColor(item.transferType)}`}
                    >
                      {item.transferType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Current Owner</p>
                    <p className="text-white font-medium">{item.currentOwner}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Previous Owner</p>
                    <p className="text-white font-medium">{item.previousOwner}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Transfer Date</p>
                    <p className="text-white font-medium">{new Date(item.transferDate).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Documents</p>
                    <p className="text-white font-medium">{item.documents.length} files</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-400">Documents:</span>
                  {item.documents.map((doc, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 border border-gray-600"
                    >
                      {doc}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-200">
                    View Details
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition duration-200">
                    Download Report
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No ownership history found</h3>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No vehicle ownership transfers recorded yet"}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-md p-4 text-center border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-white mb-1">{historyData.length}</div>
            <div className="text-gray-400 text-sm">Total Transfers</div>
          </div>
          <div className="bg-gray-800 rounded-md p-4 text-center border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {historyData.filter((item) => item.status === "Completed").length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-gray-800 rounded-md p-4 text-center border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {historyData.filter((item) => item.status === "Pending").length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
        </div>

        {/* Dashboard Link */}
        <div className="mt-6 text-center">
          <a href={"/dashboard"} className="inline-block text-sm text-blue-400 hover:underline">
            Go to Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}

export default OwnershipHistory
