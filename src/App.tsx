import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

function App() {
  const [imageUrl, setImageUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [modelInput, setModelInput] = useState('microsoft/resnet-50');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImageUrl(base64);
      await detectFake(base64);
    };
    
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  const detectFake = async (url: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: url,
          model: modelInput
        }),
      });
      
      if (!response.ok) throw new Error('Failed to analyze image');
      
      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    setImageUrl(urlInput);
    await detectFake(urlInput);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fake Image Detector</h1>
          <p className="text-lg text-gray-600">Upload an image or provide a URL to detect if it's fake</p>
        </div>

        {/* Model Input */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Hugging Face Model</h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Enter Hugging Face model ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500">
              Example: microsoft/resnet-50
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* URL Input */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Enter Image URL
              </h2>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Analyze URL
                </button>
              </form>
            </div>

            {/* File Upload */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {isDragActive
                    ? "Drop the image here"
                    : "Drag 'n' drop an image here, or click to select"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(loading || error || result || imageUrl) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing image...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center text-red-600 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {imageUrl && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Uploaded Image</h3>
                    <img
                      src={imageUrl}
                      alt="Uploaded"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                
                {result && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Detection Results</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;