
import React, { useState, useCallback } from 'react';
import { getThinkingResponse } from '../services/geminiService';
import Loader from './Loader';

interface ThinkingModeProps {
  masterPrompt: string;
}

const ThinkingMode: React.FC<ThinkingModeProps> = ({ masterPrompt }) => {
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
      const result = await getThinkingResponse(fullPrompt);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, masterPrompt]);

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      <div className="flex-grow flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-6 flex-grow overflow-y-auto">
          {isLoading && !response && (
            <div className="flex flex-col justify-center items-center h-full text-center text-gray-400">
                <Loader message="Thinking deeply..." />
                <p className="mt-4 text-sm">This may take a moment for complex queries.</p>
            </div>
          )}
          {!isLoading && !response && !error && (
            <div className="flex flex-col justify-center items-center h-full text-center text-gray-400">
              <h2 className="text-3xl font-bold mb-2">Thinking Mode</h2>
              <p className="max-w-md">For your most complex tasks. Ask for deep analysis, creative writing, code generation, or complex problem-solving. This mode uses enhanced reasoning to provide higher quality responses.</p>
            </div>
          )}
          {response && <div className="prose prose-invert max-w-none whitespace-pre-wrap">{response}</div>}
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
        <div className="p-4 border-t border-gray-700/50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a complex prompt..."
              className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full md:w-auto md:self-end px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
            >
              {isLoading ? 'Processing...' : 'Engage Thinking Mode'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ThinkingMode;
