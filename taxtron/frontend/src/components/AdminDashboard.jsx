import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [csvUploadResults, setCsvUploadResults] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    scheduledDate: '',
    status: 'Free'
  });

  // Mock auth and navigation functions for demo
  const logout = () => console.log('Logout clicked');
  const navigate = (path) => console.log('Navigate to:', path);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        setAppointments(sortedData);
      } else {
        throw new Error('Expected an array of appointments');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newAppointment)
      });
      if (!res.ok) throw new Error('Failed to add appointment');
      setShowAddModal(false);
      setNewAppointment({ scheduledDate: '', status: 'Free' });
      fetchAppointments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update appointment');
      fetchAppointments();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        if (!res.ok) throw new Error('Failed to delete appointment');
        fetchAppointments();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const parseCsvData = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    return data;
  };

  const generateInspectionId = () => {
    return 'INS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setCsvUploadLoading(true);
    setCsvUploadResults(null);

    try {
      const fileText = await csvFile.text();
      const csvData = parseCsvData(fileText);
      
      const results = {
        total: csvData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (const row of csvData) {
        try {
          const inspectionData = {
            inspectionId: generateInspectionId(),
            walletAddress: row.walletAddress || '',
            vehicleDetails: {
              ownerName: row.ownerName || '',
              fatherName: row.fatherName || '',
              cnic: row.cnic || '',
              engineNumber: row.engineNumber || '',
              chassisNumber: row.chassisNumber || '',
              make: row.make || '',
              model: row.model || '',
              variant: row.variant || '',
              manufacturingYear: parseInt(row.manufacturingYear) || 0,
              registrationYear: parseInt(row.registrationYear) || 0,
              vehicleType: row.vehicleType || '',
              fuelType: row.fuelType || ''
            },
            appointmentDetails: {
              date: row.appointmentDate || new Date().toISOString().split('T')[0],
              time: row.appointmentTime || '09:00',
              appointmentId: row.appointmentId || 'BULK_UPLOAD'
            }
          };

          const response = await fetch('http://localhost:5000/api/inspections', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(inspectionData)
          });

          if (response.ok) {
            results.success++;
          } else {
            results.failed++;
            const errorData = await response.json();
            results.errors.push(`Row ${results.success + results.failed}: ${errorData.message}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${error.message}`);
        }
      }

      setCsvUploadResults(results);
    } catch (error) {
      setError('Error processing CSV file: ' + error.message);
    } finally {
      setCsvUploadLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeColor = (status) => {
    return status === 'Free' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const downloadSampleCsv = () => {
    const sampleData = `walletAddress,ownerName,fatherName,cnic,engineNumber,chassisNumber,make,model,variant,manufacturingYear,registrationYear,vehicleType,fuelType,appointmentDate,appointmentTime,appointmentId
0x1234567890abcdef,John Doe,Robert Doe,12345-1234567-1,ENG123456,CHS789012,Toyota,Corolla,XLI,2020,2021,Car,Petrol,2024-01-15,10:00,APP001
0x0987654321fedcba,Jane Smith,Michael Smith,54321-7654321-2,ENG654321,CHS210987,Honda,Civic,VTI,2019,2020,Car,Petrol,2024-01-16,11:00,APP002`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_vehicle_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="min-h-screen p-6"><div className="bg-red-100 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-3">
            <button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition">+ Add Appointment</button>
            <button onClick={() => setShowCsvModal(true)} className="bg-green-500 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow-md transition">📄 Upload CSV Data</button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow-md transition">Logout</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {appointments.length === 0 ? (
            <div className="text-center px-6 py-12 text-gray-500 text-lg">No appointments found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <li key={appointment._id} className="px-6 py-5 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-800">{formatDate(appointment.scheduledDate)}</p>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(appointment.status)}`}>{appointment.status}</span>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button onClick={() => handleUpdateStatus(appointment._id, appointment.status === 'Free' ? 'Booked' : 'Free')} className="bg-blue-500 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">{appointment.status === 'Free' ? 'Mark as Booked' : 'Mark as Free'}</button>
                    <button onClick={() => handleDeleteAppointment(appointment._id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Appointment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Appointment</h2>
              <div onSubmit={handleAddAppointment} className="space-y-4">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
                  <input type="datetime-local" id="scheduledDate" required value={newAppointment.scheduledDate} onChange={(e) => setNewAppointment({ ...newAppointment, scheduledDate: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select id="status" value={newAppointment.status} onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Free">Free</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">Cancel</button>
                  <button type="button" onClick={handleAddAppointment} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Add</button>
                </div>
            </div>
          </div>
          </div>
        )}

        {/* CSV Upload Modal */}
        {showCsvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Upload Vehicle Data (CSV)</h2>
                <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">CSV Format Requirements:</h3>
                <p className="text-sm text-blue-700 mb-2">Your CSV file should include the following columns:</p>
                <p className="text-xs text-blue-600 font-mono">
                  walletAddress, ownerName, fatherName, cnic, engineNumber, chassisNumber, make, model, variant, manufacturingYear, registrationYear, vehicleType, fuelType, appointmentDate, appointmentTime, appointmentId
                </p>
                <button onClick={downloadSampleCsv} className="mt-3 text-blue-600 hover:text-blue-800 underline text-sm">
                  Download Sample CSV Template
                </button>
              </div>

              <div onSubmit={handleCsvUpload} className="space-y-4">
                <div>
                  <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                  <input 
                    type="file" 
                    id="csvFile" 
                    accept=".csv" 
                    required 
                    onChange={(e) => setCsvFile(e.target.files[0])} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                {csvUploadResults && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Upload Results:</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Total Records:</span> {csvUploadResults.total}</p>
                      <p className="text-sm text-green-600"><span className="font-medium">Successfully Uploaded:</span> {csvUploadResults.success}</p>
                      <p className="text-sm text-red-600"><span className="font-medium">Failed:</span> {csvUploadResults.failed}</p>
                      {csvUploadResults.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-700">Errors:</p>
                          <div className="max-h-32 overflow-y-auto">
                            {csvUploadResults.errors.map((error, index) => (
                              <p key={index} className="text-xs text-red-600 mt-1">{error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowCsvModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition">Cancel</button>
                  <button 
                    type="button" 
                    onClick={handleCsvUpload}
                    disabled={csvUploadLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {csvUploadLoading ? 'Uploading...' : 'Upload CSV'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-6">
          <a href="/admin/inspect/" className="inline-block text-white bg-blue-500 px-6 py-3 rounded-md shadow hover:bg-blue-600 transition">Go to Inspection Panel →</a>
        </div>
      </div>
      </div>
  );
}