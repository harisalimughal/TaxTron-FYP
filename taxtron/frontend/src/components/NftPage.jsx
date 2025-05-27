import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function NftPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Approved');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = async () => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      await axios.post(`/api/admin/inspect/${id}`, {
        status,
        notes,
        image: base64
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      navigate('/admin/dashboard');
    };
    if (image) reader.readAsDataURL(image);
  };

  return (
    <div className="p-10 max-w-lg mx-auto">
      <h1 className="text-xl mb-4">Inspect Vehicle</h1>
      <label>Status:</label>
      <select value={status} onChange={e => setStatus(e.target.value)} className="block w-full mb-2">
        <option>Approved</option>
        <option>Rejected</option>
      </select>
      <textarea
        className="w-full h-24 mb-2"
        placeholder="Notes..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <input type="file" onChange={e => setImage(e.target.files[0])} className="mb-4" />
      <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2">Submit Inspection</button>
    </div>
  );
}
