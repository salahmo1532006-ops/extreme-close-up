
import React, { useState, useCallback, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import Loader from './Loader';
import { AnalyzeIcon } from './icons';

interface ImageAnalyzerProps {
  masterPrompt: string;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<{ file: File, base64Url: string } | null>(null);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage({ file, base64Url: URL.createObjectURL(file) });
      setResponse('');
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sourceImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const result = await analyzeImage(fullPrompt, sourceImage.file);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, sourceImage, isLoading, masterPrompt]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/2 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Image Analyzer</h2>
        
        <div className="flex-grow space-y-4 flex flex-col">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex-grow w-full min-h-48 flex flex-col items-center justify-center bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-md hover:border-cyan-500 transition-colors"
            >
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                {sourceImage ? (
                    <img src={sourceImage.base64Url} alt="Source Preview" className="max-w-full max-h-full object-contain rounded-md p-2"/>
                ) : (
                    <div className="text-center text-gray-400">
                        <AnalyzeIcon />
                        <span className="text-sm mt-1">Click to upload an image</span>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a question about the image..."
                    className="flex-grow bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    disabled={isLoading || !sourceImage}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !sourceImage}
                    className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
                >
                    {isLoading ? '...' : 'Analyze'}
                </button>
            </form>
        </div>
      </div>
      <div className="flex-grow bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-6 overflow-hidden">
        <div className="w-full h-full overflow-y-auto">
            {isLoading && <div className="flex justify-center items-center h-full"><Loader message="Analyzing..." /></div>}
            {error && <p className="text-red-400 text-center">Error: {error}</p>}
            {response && <p className="whitespace-pre-wrap text-gray-300">{response}</p>}
            {!isLoading && !response && !error && <p className="text-gray-400 text-center">The analysis will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
