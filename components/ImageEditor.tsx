
import React, { useState, useCallback, useRef } from 'react';
import { editImage } from '../services/geminiService';
import Loader from './Loader';
import { DownloadIcon } from './icons';

interface ImageEditorProps {
  masterPrompt: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<{ file: File, base64Url: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImage({ file, base64Url: URL.createObjectURL(file) });
      setEditedImage(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !originalImage || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const image = await editImage(fullPrompt, originalImage.file);
      setEditedImage(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, originalImage, isLoading, masterPrompt]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/3 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col flex-grow">
          <h2 className="text-2xl font-bold text-cyan-400">Image Editor</h2>
          
          <div className="flex-grow space-y-6">
            <div>
              <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 transition-colors"
              >
                {originalImage ? 'Change Image' : 'Upload Image'}
              </button>
            </div>
            
            {originalImage && (
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Prompt</label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Add a retro filter, remove the person in the background"
                  className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  disabled={isLoading || !originalImage}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || !originalImage}
            className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {isLoading ? 'Editing...' : 'Edit Image'}
          </button>
        </form>
      </div>

      <div className="flex-grow flex gap-4">
        <div className="w-1/2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-4 overflow-hidden">
          {originalImage ? (
            <img src={originalImage.base64Url} alt="Original" className="max-w-full max-h-full object-contain rounded-lg"/>
          ) : <p className="text-gray-400">Upload an image to start</p>}
        </div>
        <div className="w-1/2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-4 overflow-hidden">
          {isLoading && <Loader message="Editing image..." />}
          {error && <p className="text-red-400 text-center">Error: {error}</p>}
          {editedImage && 
            <div className="relative w-full h-full flex justify-center items-center">
                <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain rounded-lg"/>
                <a
                    href={editedImage}
                    download="edited-image.png"
                    className="absolute bottom-4 right-4 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors duration-300 shadow-md text-sm flex items-center gap-2"
                >
                    <DownloadIcon />
                    Download
                </a>
            </div>
          }
          {!isLoading && !editedImage && !error && <p className="text-gray-400">Your edited image will appear here</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;