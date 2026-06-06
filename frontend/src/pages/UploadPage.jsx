import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyzeDataset } from '../services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (file) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const data = await analyzeDataset(file, (progress) => {
        // Optional: can use progress to animate spinner
      });
      
      // Navigate to dashboard and pass data via state
      navigate('/dashboard', { state: { results: data, filename: file.name } });
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Upload Dataset</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Upload your CSV file to begin. The Adaptive ML Engine will automatically detect the problem type and structure.
        </p>
      </div>

      <div className="glass-card p-2 shadow-2xl relative overflow-hidden animate-slide-up">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-abb-accent via-abb-purple to-abb-cyan"></div>
        
        <div className="p-8">
          {isAnalyzing ? (
            <LoadingSpinner />
          ) : (
            <FileUpload onFileSelect={handleFileSelect} disabled={isAnalyzing} />
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-abb-red/10 border border-abb-red/20 flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-abb-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-abb-red font-semibold text-sm mb-1">Analysis Failed</h4>
                <p className="text-slate-300 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
