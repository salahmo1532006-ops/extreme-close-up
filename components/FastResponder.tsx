
import React, { useState, useCallback } from 'react';
import { getFastResponseStream } from '../services/geminiService';
import Loader from './Loader';

interface FastResponderProps {
  masterPrompt: string;
}

const FastResponder: React.FC<FastResponderProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const stream = await getFastResponseStream(fullPrompt);
      for await (const chunk of stream) {
        setResponse((prev) => prev + chunk.text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, masterPrompt]);

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4">
      <div className="flex-grow flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-4 text-gray-300 flex-grow overflow-y-auto">
          {isLoading && !response && <div className="flex justify-center items-center h-full"><Loader message="Thinking..." /></div>}
          {!isLoading && !response && !error && (
            <div className="flex flex-col justify-center items-center h-full text-center text-gray-400">
              <h2 className="text-2xl font-bold mb-2">Fast Responder</h2>
              <p>Ask anything and get a low-latency response.</p>
            </div>
          )}
          {response && <p className="whitespace-pre-wrap">{response}</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700/50">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question..."
              className="flex-grow bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FastResponder;
