import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    scheduledDate: '',
    status: 'Free'
  });

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

  const formatDate = (dateString) => {
    const options = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeColor = (status) => {
    return status === 'Free' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (error) return <div className="min-h-screen p-6"><div className="bg-red-100 text-red-700 px-4 py-3 rounded">Error: {error}</div></div>;

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md transition">+ Add Appointment</button>
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Appointment</h2>
              <form onSubmit={handleAddAppointment} className="space-y-4">
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
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Add</button>
                </div>
              </form>
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
