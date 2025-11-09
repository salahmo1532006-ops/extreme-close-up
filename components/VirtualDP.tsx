
import React, { useState, useCallback } from 'react';
import { getVDPResponse } from '../services/geminiService';
import Loader from './Loader';
import { CopyIcon } from './icons';

const VirtualDP: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');
    setCopySuccess('');

    try {
      const result = await getVDPResponse(prompt);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
        console.error('Could not copy text: ', err);
        setCopySuccess('Failed!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const renderResponse = () => {
    if (!response) return null;
    
    const lines = response.split('\n').filter(line => line.trim() !== '');
    let enhancedPromptText = '';

    const formattedResponse = lines.map((line, index) => {
        const parts = line.split(':');
        const label = parts[0];
        const content = parts.slice(1).join(':').trim();
        
        if (['Analysis', 'Lens Selection', 'Reason', 'Enhanced Prompt'].includes(label)) {
            if (label === 'Enhanced Prompt') {
                enhancedPromptText = content;
            }
            return (
                <div key={index}>
                    <p className="font-semibold text-cyan-400">{label}:</p>
                    <p className="pl-2">{content}</p>
                </div>
            );
        }
        return <p key={index}>{line}</p>;
    });

    return (
        <div className="space-y-4 text-gray-300">
            {formattedResponse}
            {enhancedPromptText && (
                <div className="pt-2">
                    <button
                        onClick={() => handleCopy(enhancedPromptText)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-600/70 text-cyan-300 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        <CopyIcon />
                        {copySuccess || 'Copy Enhanced Prompt'}
                    </button>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4">
        <div className="flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Virtual Director of Photography</h2>
                <p className="text-gray-400 mb-6">Describe a shot, and I'll enhance your prompt with the perfect cinematic lens package and researched historical details to maximize its dramatic impact.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="shot-description" className="block text-sm font-medium text-gray-300 mb-2">Your Shot Description</label>
                        <textarea
                        id="shot-description"
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A lone 1880s pioneer standing on a cliff overlooking a stormy sea."
                        className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        disabled={isLoading}
                        />
                    </div>
                     <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="w-full md:w-auto px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
                        >
                        {isLoading ? 'Enhancing...' : 'Enhance Prompt'}
                    </button>
                </form>
            </div>
            {(isLoading || error || response) && (
                <div className="p-6 border-t border-gray-700/50">
                    {isLoading && <Loader message="Analyzing shot..." />}
                    {error && <p className="text-red-400">Error: {error}</p>}
                    {response && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-200 mb-4">DP Analysis & Enhanced Prompt</h3>
                            {renderResponse()}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default VirtualDP;
