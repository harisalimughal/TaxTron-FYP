import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BulkImport() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
      setUploadResults(null);
    } else {
      setError('Please select a valid CSV file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('http://localhost:5000/api/admin/bulk-import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResults(data);
        setUploadProgress(100);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // CSV template with required headers
    const csvContent = `fullName,cnic,email,walletAddress,engineNumber,chassisNumber,make,model,variant,year,engineCapacity,fuelType,transmission,color,bodyType,seatingCapacity,registrationNumber
John Doe,12345-6789012-3,john@example.com,0x1234567890abcdef1234567890abcdef12345678,R18A1-123456,JHMFA1F80AS123456,Honda,Civic,1.8L EX,2023,1799,Petrol,Automatic,White,Sedan,5,ABC-123
Jane Smith,98765-4321098-7,jane@example.com,0xabcdef1234567890abcdef1234567890abcdef12,L15B7-789123,1HGBH41JXMN109186,Toyota,Corolla,1.8L GLI,2023,1798,Petrol,Manual,Silver,Sedan,5,XYZ-456`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Vehicle Import</h1>
                <p className="text-gray-600">Import multiple vehicles from CSV file</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Import Instructions</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>CSV Format:</strong> Use the template below with exact column headers</p>
              <p>• <strong>Required Fields:</strong> All columns must be present and properly formatted</p>
              <p>• <strong>Wallet Address:</strong> Must be a valid Ethereum address format</p>
              <p>• <strong>CNIC:</strong> Must follow Pakistan CNIC format (12345-6789012-3)</p>
              <p>• <strong>Vehicle Details:</strong> Must match existing vehicle database specifications</p>
              <p>• <strong>Blockchain Registration:</strong> Vehicles will be automatically registered on blockchain</p>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {selectedFile ? selectedFile.name : 'Click to upload CSV file'}
                </p>
                <p className="text-gray-600">or drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">Only CSV files are supported</p>
              </label>
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Upload Button */}
          <div className="mb-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                selectedFile && !isUploading
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Uploading... {uploadProgress}%</span>
                </div>
              ) : (
                'Import Vehicles'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">Error: {error}</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {uploadResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Import Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Records Processed:</span>
                  <span className="font-medium">{uploadResults.totalProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Successfully Imported:</span>
                  <span className="font-medium text-green-800">{uploadResults.successCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Failed:</span>
                  <span className="font-medium text-red-800">{uploadResults.failureCount}</span>
                </div>
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-red-700 font-medium mb-2">Errors:</p>
                    <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded p-2">
                      {uploadResults.errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-xs">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
