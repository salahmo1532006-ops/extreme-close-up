
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateVideoFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Loader from './Loader';
import AspectRatioSelector from './AspectRatioSelector';
import type { VideoAspectRatio } from '../types';

interface VideoGeneratorProps {
  masterPrompt: string;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<{ file: File, base64Url: string } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const aspectOptions: VideoAspectRatio[] = ['16:9', '9:16'];

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } else {
        setApiKeySelected(true); // Assume key is present in environments without aistudio
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    // Assume success to avoid race conditions. If it fails, the API call will catch it.
    setApiKeySelected(true);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage({ file, base64Url: URL.createObjectURL(file) });
      setGeneratedVideoUrl(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || isLoading) return;

    if (!apiKeySelected) {
      setError("Please select an API key to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const base64Data = await fileToBase64(sourceImage.file);
      const videoBlob = await generateVideoFromImage(
        base64Data,
        sourceImage.file.type,
        fullPrompt,
        aspectRatio,
        setLoadingMessage
      );
      const url = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes("Requested entity was not found")) {
        setError("API Key error. Please re-select your key.");
        setApiKeySelected(false);
      } else {
        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, sourceImage, aspectRatio, isLoading, apiKeySelected, masterPrompt]);

  if (apiKeySelected === null) {
    return <div className="w-full h-full flex justify-center items-center"><Loader message="Initializing..." /></div>;
  }

  if (!apiKeySelected) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 m-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">API Key Required</h2>
        <p className="text-gray-300 mb-6 max-w-md">Video generation with Veo requires a Google AI API key. Please select a key to continue. For more information on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">our billing documentation</a>.</p>
        <button onClick={handleSelectKey} className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors">
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/3 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-cyan-400">Video Generator</h2>
          <div>
            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 transition-colors"
            >
              {sourceImage ? 'Change Source Image' : 'Upload Source Image'}
            </button>
            {sourceImage && <img src={sourceImage.base64Url} alt="Source" className="mt-4 rounded-lg w-full object-cover"/>}
          </div>
          <div>
            <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt (Optional)</label>
            <textarea
              id="video-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., The camera slowly zooms out"
              className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              disabled={isLoading || !sourceImage}
            />
          </div>
          <AspectRatioSelector
            label="Aspect Ratio"
            options={aspectOptions}
            selected={aspectRatio}
            // FIX: Wrapped state setter in a lambda to resolve TypeScript type inference issue.
            onSelect={(value) => setAspectRatio(value)}
          />
          <button
            type="submit"
            disabled={isLoading || !sourceImage}
            className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {isLoading ? 'Generating Video...' : 'Generate Video'}
          </button>
        </form>
      </div>
      <div className="flex-grow bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-6 overflow-hidden">
        {isLoading && <Loader message={loadingMessage} />}
        {error && <p className="text-red-400 text-center">Error: {error}</p>}
        {generatedVideoUrl && <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />}
        {!isLoading && !generatedVideoUrl && !error && <p className="text-gray-400 text-center">Your generated video will appear here.</p>}
      </div>
    </div>
  );
};

export default VideoGenerator;