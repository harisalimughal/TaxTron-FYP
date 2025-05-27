import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    scheduledDate: '',
    status: 'Free'
  });

  // Fetch appointments
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
        // Sort appointments by date
        const sortedData = data.sort((a, b) => 
          new Date(a.scheduledDate) - new Date(b.scheduledDate)
        );
        setAppointments(sortedData);
      } else {
        throw new Error('Expected an array of appointments');
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new appointment
  const handleAddAppointment = async (e) => {
    e.preventDefault();
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
      console.error("Error adding appointment:", error);
      setError(error.message);
    }
  };

  // Update appointment status
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
      console.error("Error updating appointment:", error);
      setError(error.message);
    }
  };

  // Delete appointment
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
        console.error("Error deleting appointment:", error);
        setError(error.message);
      }
    }
  };

  // Open edit modal
  const openEditModal = (appointment) => {
    setCurrentAppointment(appointment);
    setShowEditModal(true);
  };

  // // Update appointment
  // const handleUpdateAppointment = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${localStorage.getItem('adminToken')}`
  //       },
  //       body: JSON.stringify(currentAppointment)
  //     });
      
  //     if (!res.ok) throw new Error('Failed to update appointment');
      
  //     setShowEditModal(false);
  //     fetchAppointments();
  //   } catch (error) {
  //     console.error("Error updating appointment:", error);
  //     setError(error.message);
  //   }
  // };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    return status === 'Free' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Appointment
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No appointments found. Add your first appointment!
              </li>
            ) : (
              appointments.map((appointment) => (
                <li key={appointment._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.scheduledDate)}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(appointment._id, appointment.status === 'Free' ? 'Booked' : 'Free')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {appointment.status === 'Free' ? 'Mark as Booked' : 'Mark as Free'}
                      </button>
                      {/* <button
                        onClick={() => openEditModal(appointment)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Edit
                      </button> */}
                      <button
                        onClick={() => handleDeleteAppointment(appointment._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Add New Appointment Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Appointment
                    </h3>
                    <div className="mt-4">
                      <div>
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDate">
                            Date and Time
                          </label>
                          <input
                            type="datetime-local"
                            id="scheduledDate"
                            required
                            value={newAppointment.scheduledDate}
                            onChange={(e) => setNewAppointment({ ...newAppointment, scheduledDate: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                            Status
                          </label>
                          <select
                            id="status"
                            value={newAppointment.status}
                            onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="Free">Free</option>
                            <option value="Booked">Booked</option>
                          </select>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="mr-2 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            onClick={handleAddAppointment}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {/* {showEditModal && currentAppointment && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Appointment
                    </h3>
                    <div className="mt-4">
                      <div>
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editScheduledDate">
                            Date and Time
                          </label>
                          <input
                            type="datetime-local"
                            id="editScheduledDate"
                            required
                            value={new Date(currentAppointment.scheduledDate).toISOString().slice(0, 16)}
                            onChange={(e) => setCurrentAppointment({ ...currentAppointment, scheduledDate: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editStatus">
                            Status
                          </label>
                          <select
                            id="editStatus"
                            value={currentAppointment.status}
                            onChange={(e) => setCurrentAppointment({ ...currentAppointment, status: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="Free">Free</option>
                            <option value="Booked">Booked</option>
                          </select>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="mr-2 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            onClick={handleUpdateAppointment}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Update Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
      <div className="mt-2 text-center">
              <a 
                href={`/admin/inspect/`} 
                className="inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition-all duration-300"
  >

                Go to Inspection Panel →
              </a>
            </div>
    </div>
  );
}