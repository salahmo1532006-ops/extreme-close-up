
import React, { useState, useCallback } from 'react';
import { getAccurateResponse } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import Loader from './Loader';

interface AccurateResponderProps {
  masterPrompt: string;
}

const AccurateResponder: React.FC<AccurateResponderProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<GenerateContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const result = await getAccurateResponse(fullPrompt);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, masterPrompt]);

  const sources = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4">
      <div className="flex-grow flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-4 text-gray-300 flex-grow overflow-y-auto">
          {isLoading && !response && <div className="flex justify-center items-center h-full"><Loader message="Searching..." /></div>}
          {!isLoading && !response && !error && (
            <div className="flex flex-col justify-center items-center h-full text-center text-gray-400">
              <h2 className="text-2xl font-bold mb-2">Accurate Responder</h2>
              <p>Ask about recent events or anything that requires up-to-date information.</p>
            </div>
          )}
          {response && <p className="whitespace-pre-wrap">{response.text}</p>}
          {sources && sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">Sources:</h3>
              <ul className="space-y-2">
                {sources.map((source, index) => (
                  <li key={index} className="text-xs">
                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-300 underline break-all">
                      {index + 1}. {source.web.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700/50">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Who won the last F1 race?"
              className="flex-grow bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
            >
              {isLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccurateResponder;
