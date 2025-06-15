import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Notifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const account = location.state?.account;
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatuses, setPaymentStatuses] = useState({});

  const checkPaymentStatus = async (inspectionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/inspections/${inspectionId}/payment-status`);
      if (response.ok) {
        const data = await response.json();
        return {
          isPaid: data.isPaid || false,
          transactionHash: data.transactionHash || ''
        };
      }
    } catch (error) {
      console.log('Payment status check failed:', error);
    }
    return { isPaid: false, transactionHash: '' };
  };

  useEffect(() => {
    const fetchInspectionStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/inspections/wallet/${account}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
        });

        console.log(res);
  
        if (Array.isArray(res.data.data)) {
          setInspectionData(res.data.data);
          
          // Check payment status for each approved inspection
          const paymentStatusPromises = res.data.data
            .filter(inspection => inspection.status === 'Approved')
            .map(async (inspection) => {
              const paymentInfo = await checkPaymentStatus(inspection.inspectionId);
              return {
                inspectionId: inspection.inspectionId,
                ...paymentInfo
              };
            });

          const paymentResults = await Promise.all(paymentStatusPromises);
          const paymentStatusMap = {};
          
          paymentResults.forEach(result => {
            paymentStatusMap[result.inspectionId] = {
              isPaid: result.isPaid,
              transactionHash: result.transactionHash
            };
          });
          
          setPaymentStatuses(paymentStatusMap);
        } else {
          console.error("Unexpected inspection data:", res.data);
          setInspectionData([]);
        }
      } catch (err) {
        console.error("Failed to fetch inspection data:", err);
        setInspectionData([]);
      } finally {
        setLoading(false);
      }
    };
  
    if (account) {
      fetchInspectionStatus();
    } else {
      setLoading(false);
    }
  }, [account]);

  const handleBackToDashboard = () => {
    navigate("/dashboard", { state: { account } });
  };

  const handleViewNFT = (inspectionId) => {
    navigate(`/view-nft/${inspectionId}`);
  };

  const handlePayFee = (inspectionId) => {
    navigate(`/pay-fee/${inspectionId}`, { state: { account } });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-indigo-400">TaxTron</h1>
        </div>
        
        
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-8 pb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold text-white">Your Vehicles</h2>
            <div className="flex items-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200">
                {account ? `Connected Account: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
              </button>
              <button
                className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
                onClick={handleBackToDashboard}
              >
                &lt; Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-400">Loading notifications...</div>
            </div>
          ) : (
            <div className="max-w-4xl">
              <div className="bg-gray-800 p-6 rounded-lg border border-indigo-500/30">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-indigo-400">Vehicle Inspection Status</h3>
                    <p className="text-gray-400 text-sm">Track your vehicle inspection progress</p>
                  </div>
                </div>

                {inspectionData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg">No inspection records found</p>
                    <p className="text-gray-500 text-sm mt-2">Your vehicle inspection notifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inspectionData.map((v, idx) => (
                    <div key={idx} className="bg-gray-900 p-5 border border-gray-700 rounded-lg hover:border-indigo-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-white text-lg">
                            Vehicle Owner: {v.vehicleDetails?.ownerName || "N/A"}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            Inspection ID: {v.inspectionId}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            v.status === 'Approved' || v.status === 'Accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            v.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            v.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Appointment Date</p>
                          <p className="text-white">{v.appointmentDetails?.date || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Appointment Time</p>
                          <p className="text-white">{v.appointmentDetails?.time || "N/A"}</p>
                        </div>
                      </div>

                      {v.status === 'Approved' && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                          <div className="flex items-center justify-between">
                            {paymentStatuses[v.inspectionId]?.isPaid ? (
                              <>
                                <span className="text-green-400 font-medium">Payment completed - NFT available</span>
                                <button 
                                  onClick={() => handleViewNFT(v.inspectionId)}
                                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  View NFT →
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-400 font-medium">Registration fee payment required</span>
                                <button 
                                  onClick={() => handlePayFee(v.inspectionId)}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                                >
                                  Pay Fee →
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {v.status === 'Accepted' && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-green-400 font-medium">Inspection completed successfully</span>
                            <button
                              onClick={() => handleViewNFT(v.inspectionId)}
                              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                            >
                              View NFT →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Notifications;