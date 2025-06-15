import { useState, useEffect } from 'react';
import { Search, Filter, Eye, ThumbsUp, ThumbsDown, Loader, AlertCircle, Check, ChevronLeft, Upload, X, RefreshCw } from 'lucide-react';

// Main Admin Dashboard Component
export default function AdminInspect() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  
  // Fetch all inspections when component mounts or filter changes
  useEffect(() => {
    async function fetchInspections() {
      try {
        setLoading(true);
        let url = 'http://localhost:5000/api/inspections';
        if (statusFilter) {
          url += `?status=${statusFilter}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch inspections');
        const data = await response.json();
        setInspections(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInspections();
  }, [statusFilter]);
  
  // Handle selecting an inspection for detailed view
  const handleSelectInspection = (inspection) => {
    setSelectedInspection(inspection);
    setIsDetailView(true);
  };
  
  // Handle back button from detailed view
  const handleBackToList = () => {
    setIsDetailView(false);
    setSelectedInspection(null);
  };
  
  // Filter inspections based on search term
  const filteredInspections = inspections.filter(inspection => 
    inspection.inspectionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspection.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inspection.vehicleDetails && inspection.vehicleDetails.make && 
     inspection.vehicleDetails.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (inspection.vehicleDetails && inspection.vehicleDetails.model && 
     inspection.vehicleDetails.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading inspections...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>Error: {error}</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isDetailView && selectedInspection ? (
        <InspectionDetailView 
          inspection={selectedInspection} 
          onBack={handleBackToList} 
          onStatusUpdate={() => {
            setIsDetailView(false);
            // Refresh the list after status update
            const updatedUrl = statusFilter ? `http://localhost:5000/api/inspections?status=${statusFilter}` : 'http://localhost:5000/api/inspections';
            fetch(updatedUrl)
              .then(res => res.json())
              .then(data => setInspections(data.data))
              .catch(err => setError(err.message));
          }}
        />
      ) : (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Inspection Dashboard</h1>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row mb-6 space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search inspections..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex-shrink-0">
                <div className="relative inline-flex">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md appearance-none focus:ring-blue-500 focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Inspections Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInspections.length > 0 ? (
                    filteredInspections.map((inspection) => (
                      <tr key={inspection.inspectionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {inspection.inspectionId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inspection.vehicleDetails ? `${inspection.vehicleDetails.make} ${inspection.vehicleDetails.model}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inspection.walletAddress.substring(0, 6)}...{inspection.walletAddress.substring(inspection.walletAddress.length - 4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={inspection.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSelectInspection(inspection)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No inspections found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';
  
  if (status === 'Approved') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (status === 'Rejected') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
  } else if (status === 'Pending') {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
}

// Inspection Detail View Component
function InspectionDetailView({ inspection, onBack, onStatusUpdate }) {
  const [status, setStatus] = useState(inspection.status);
  const [notes, setNotes] = useState(inspection.inspectionNotes || '');
  const [registrationNumber, setRegistrationNumber] = useState(inspection.registrationNumber || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [vehicleImageUrl, setVehicleImageUrl] = useState(inspection.vehicleImageUrl || '');
  const [generatingRegNumber, setGeneratingRegNumber] = useState(false);
  
  // Generate a unique registration number
  const generateRegistrationNumber = () => {
    // Format: ABC-1234 (3 letters followed by dash and 4 digits)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    
    let regNumber = '';
    
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      regNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    regNumber += '-';
    
    // Generate 4 random digits
    for (let i = 0; i < 4; i++) {
      regNumber += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    
    return regNumber;
  };
  
  // Check if registration number exists and generate a unique one
  const generateUniqueRegistrationNumber = async () => {
    setGeneratingRegNumber(true);
    setError(null);
    
    try {
      let attempts = 0;
      let isUnique = false;
      let newRegNumber = '';
      
      while (!isUnique && attempts < 10) {
        newRegNumber = generateRegistrationNumber();
        
        // Check if this registration number already exists
        const response = await fetch(`http://localhost:5000/api/inspections/check-registration/${newRegNumber}`);
        
        if (response.ok) {
          const data = await response.json();
          isUnique = !data.exists; // If exists is false, then it's unique
        } else if (response.status === 404) {
          // Registration number doesn't exist, so it's unique
          isUnique = true;
        } else {
          throw new Error('Failed to check registration number uniqueness');
        }
        
        attempts++;
      }
      
      if (isUnique) {
        setRegistrationNumber(newRegNumber);
      } else {
        setError('Failed to generate unique registration number after multiple attempts');
      }
    } catch (err) {
      setError('Error generating registration number: ' + err.message);
    } finally {
      setGeneratingRegNumber(false);
    }
  };
  
  // Auto-generate registration number when status changes to Approved
  useEffect(() => {
    if (status === 'Approved' && !registrationNumber) {
      generateUniqueRegistrationNumber();
    }
  }, [status]);
  
  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  // Upload image to Cloudinary
  const uploadImageToCloudinary = async () => {
    if (!selectedImage) return null;
    
    setImageUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('upload_preset', 'vehicle_nft'); // Replace with your Cloudinary preset
      
      // Upload to Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/harrycloudinary/image/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      setVehicleImageUrl(data.secure_url);
      return data.secure_url;
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
      return null;
    } finally {
      setImageUploading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Upload image if selected and status is Approved
      let imageUrl = vehicleImageUrl;
      if (status === 'Approved' && selectedImage) {
        imageUrl = await uploadImageToCloudinary();
        if (!imageUrl && selectedImage) {
          setError('Failed to upload vehicle image. Please try again.');
          setSubmitting(false);
          return;
        }
      }
      
      // Update inspection status
      const statusResponse = await fetch(`http://localhost:5000/api/inspections/${inspection.inspectionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          inspectionNotes: notes,
          registrationNumber: status === 'Approved' ? registrationNumber : undefined,
          inspectedBy: 'admin-user' // Replace with actual admin user ID or name
        })
      });
      
      if (!statusResponse.ok) throw new Error('Failed to update inspection status');
      
      // If image URL exists and status is approved, save the image URL
      if (imageUrl && status === 'Approved') {
        // Assuming there's an endpoint to save vehicle images
        // This endpoint isn't in the provided code but would be needed
        const imageResponse = await fetch(`http://localhost:5000/api/inspections/${inspection.inspectionId}/vehicle-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageUrl,
            walletAddress: inspection.walletAddress
          })
        });
        
        if (!imageResponse.ok) throw new Error('Failed to save vehicle image');
      }
      
      setSuccess(`Inspection ${status.toLowerCase()} successfully`);
      setTimeout(() => {
        onStatusUpdate();
      }, 1500);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to list
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Inspection Details</h1>
        
        {/* Inspection Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-3">Basic Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 text-sm">Inspection ID:</span>
                <p className="font-medium">{inspection.inspectionId}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Status:</span>
                <div className="mt-1">
                  <StatusBadge status={inspection.status} />
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Wallet Address:</span>
                <p className="font-medium">{inspection.walletAddress}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Created:</span>
                <p className="font-medium">{new Date(inspection.createdAt).toLocaleString()}</p>
              </div>
              {inspection.inspectionDate && (
                <div>
                  <span className="text-gray-500 text-sm">Inspection Date:</span>
                  <p className="font-medium">{new Date(inspection.inspectionDate).toLocaleString()}</p>
                </div>
              )}
              {inspection.inspectedBy && (
                <div>
                  <span className="text-gray-500 text-sm">Inspected By:</span>
                  <p className="font-medium">{inspection.inspectedBy}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-3">Vehicle Details</h2>
            {inspection.vehicleDetails ? (
              <div className="space-y-2">
                {inspection.vehicleDetails.make && (
                  <div>
                    <span className="text-gray-500 text-sm">Make:</span>
                    <p className="font-medium">{inspection.vehicleDetails.make}</p>
                  </div>
                )}
                {inspection.vehicleDetails.model && (
                  <div>
                    <span className="text-gray-500 text-sm">Model:</span>
                    <p className="font-medium">{inspection.vehicleDetails.model}</p>
                  </div>
                )}
                {inspection.vehicleDetails.year && (
                  <div>
                    <span className="text-gray-500 text-sm">Year:</span>
                    <p className="font-medium">{inspection.vehicleDetails.year}</p>
                  </div>
                )}
                {inspection.vehicleDetails.vin && (
                  <div>
                    <span className="text-gray-500 text-sm">VIN:</span>
                    <p className="font-medium">{inspection.vehicleDetails.vin}</p>
                  </div>
                )}
                {inspection.vehicleDetails.color && (
                  <div>
                    <span className="text-gray-500 text-sm">Color:</span>
                    <p className="font-medium">{inspection.vehicleDetails.color}</p>
                  </div>
                )}
                {inspection.registrationNumber && (
                  <div>
                    <span className="text-gray-500 text-sm">Registration Number:</span>
                    <p className="font-medium">{inspection.registrationNumber}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No vehicle details available</p>
            )}
          </div>
        </div>
        
        {/* Appointment Details if available */}
        {inspection.appointmentDetails && (
          <div className="bg-gray-50 p-4 rounded-md mb-8">
            <h2 className="text-lg font-semibold mb-3">Appointment Details</h2>
            <div className="space-y-2">
              {inspection.appointmentDetails.date && (
                <div>
                  <span className="text-gray-500 text-sm">Date:</span>
                  <p className="font-medium">{new Date(inspection.appointmentDetails.date).toLocaleDateString()}</p>
                </div>
              )}
              {inspection.appointmentDetails.time && (
                <div>
                  <span className="text-gray-500 text-sm">Time:</span>
                  <p className="font-medium">{inspection.appointmentDetails.time}</p>
                </div>
              )}
              {inspection.appointmentDetails.location && (
                <div>
                  <span className="text-gray-500 text-sm">Location:</span>
                  <p className="font-medium">{inspection.appointmentDetails.location}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Existing Vehicle Image */}
        {inspection.vehicleImageUrl && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Vehicle Image</h2>
            <img 
              src={inspection.vehicleImageUrl} 
              alt="Vehicle" 
              className="max-h-64 rounded-md border border-gray-200" 
            />
          </div>
        )}
        
        {/* Inspection Action Form */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Update Inspection Status</h2>
          
          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-4">
              <div 
                className={`flex items-center p-3 border rounded-md cursor-pointer ${status === 'Pending' ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-300'}`}
                onClick={() => setStatus('Pending')}
              >
                <div className="w-5 h-5 bg-yellow-100 rounded-full mr-2 flex items-center justify-center">
                  {status === 'Pending' && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                </div>
                <span>Pending</span>
              </div>
              
              <div 
                className={`flex items-center p-3 border rounded-md cursor-pointer ${status === 'Approved' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'border-gray-300'}`}
                onClick={() => setStatus('Approved')}
              >
                <div className="w-5 h-5 bg-green-100 rounded-full mr-2 flex items-center justify-center">
                  {status === 'Approved' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                </div>
                <span className="flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Approve
                </span>
              </div>
              
              <div 
                className={`flex items-center p-3 border rounded-md cursor-pointer ${status === 'Rejected' ? 'bg-red-50 border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
                onClick={() => setStatus('Rejected')}
              >
                <div className="w-5 h-5 bg-red-100 rounded-full mr-2 flex items-center justify-center">
                  {status === 'Rejected' && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                </div>
                <span className="flex items-center">
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Reject
                </span>
              </div>
            </div>
          </div>
          
          {/* Registration Number (only when approving) */}
          {status === 'Approved' && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Registration Number</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Auto-generated registration number"
                  readOnly
                />
                <button
                  type="button"
                  onClick={generateUniqueRegistrationNumber}
                  disabled={generatingRegNumber}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center"
                >
                  {generatingRegNumber ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Registration number is auto-generated. Click refresh to generate a new unique number.
              </p>
            </div>
          )}
          
          {/* Vehicle Image Upload (only when approving) */}
          {status === 'Approved' && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Vehicle Image</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="file"
                    id="vehicle-image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="vehicle-image"
                    className="flex items-center px-4 py-2 bg-white text-blue-500 rounded-md border border-blue-500 cursor-pointer hover:bg-blue-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </label>
                </div>
                
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-20 w-auto rounded-md border border-gray-200" 
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {imageUploading && <p className="text-sm text-blue-500 mt-2">Uploading image...</p>}
            </div>
          )}
          
          {/* Inspection Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Inspection Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Enter inspection notes or reason for approval/rejection"
            ></textarea>
          </div>
          
          {/* Status Notifications */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || imageUploading || generatingRegNumber}
              className={`px-6 py-2 rounded-md text-white font-medium flex items-center 
                ${submitting || imageUploading || generatingRegNumber ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Inspection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}