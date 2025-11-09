
import React, { useState, useCallback, useRef } from 'react';
import { editImage } from '../services/geminiService';
import Loader from './Loader';
import { DownloadIcon } from './icons';

interface ImageCompositorProps {
  masterPrompt: string;
}

type ImageState = { file: File, base64Url: string };

const ImageCompositor: React.FC<ImageCompositorProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [baseImage, setBaseImage] = useState<ImageState | null>(null);
  const [detailImage, setDetailImage] = useState<ImageState | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<ImageState | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({ file, base64Url: URL.createObjectURL(file) });
      setCompositeImage(null);
      setError(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !baseImage || !detailImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCompositeImage(null);

    try {
      const fullPrompt = masterPrompt ? `${masterPrompt}\n\n${prompt}` : prompt;
      const image = await editImage(fullPrompt, baseImage.file, detailImage.file);
      setCompositeImage(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, baseImage, detailImage, isLoading, masterPrompt]);

  const ImagePreview: React.FC<{ image: ImageState | null, title: string }> = ({ image, title }) => (
    <div className="w-1/2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex flex-col justify-center items-center p-4 overflow-hidden">
        <p className="text-sm font-semibold text-gray-400 mb-2">{title}</p>
        <div className="w-full h-full flex justify-center items-center">
        {image ? (
            <img src={image.base64Url} alt={title} className="max-w-full max-h-full object-contain rounded-lg"/>
        ) : <p className="text-gray-500 text-xs">Upload an image</p>}
        </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      <div className="w-full md:w-1/3 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col flex-grow">
          <h2 className="text-2xl font-bold text-cyan-400">Image Compositor</h2>
          
          <div className="flex-grow space-y-4">
            <div>
              <input type="file" accept="image/*" onChange={handleFileChange(setBaseImage)} ref={baseFileInputRef} className="hidden" />
              <button
                type="button"
                onClick={() => baseFileInputRef.current?.click()}
                className="w-full py-2.5 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                {baseImage ? 'Change Base Image' : 'Upload Base Image'}
              </button>
              {baseImage && <img src={baseImage.base64Url} alt="Base preview" className="mt-2 rounded-md w-full object-cover h-24"/>}
            </div>
            
            <div>
              <input type="file" accept="image/*" onChange={handleFileChange(setDetailImage)} ref={detailFileInputRef} className="hidden" />
              <button
                type="button"
                onClick={() => detailFileInputRef.current?.click()}
                className="w-full py-2.5 bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                {detailImage ? 'Change Detail Image' : 'Upload Detail Image'}
              </button>
              {detailImage && <img src={detailImage.base64Url} alt="Detail preview" className="mt-2 rounded-md w-full object-cover h-24"/>}
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Composition Prompt</label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Reflect the detail image in the pupil of the eye in the base image."
                className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                disabled={isLoading || !baseImage || !detailImage}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || !baseImage || !detailImage}
            className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {isLoading ? 'Compositing...' : 'Generate Composite'}
          </button>
        </form>
      </div>

      <div className="flex-grow flex flex-col gap-4">
        <div className="flex-1 flex gap-4">
            <ImagePreview image={baseImage} title="Base Image" />
            <ImagePreview image={detailImage} title="Detail Image" />
        </div>
        <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-4 overflow-hidden">
          {isLoading && <Loader message="Compositing images..." />}
          {error && <p className="text-red-400 text-center">Error: {error}</p>}
          {compositeImage && 
            <div className="relative w-full h-full flex justify-center items-center">
                <img src={compositeImage} alt="Composite" className="max-w-full max-h-full object-contain rounded-lg"/>
                <a
                    href={compositeImage}
                    download="composite-image.png"
                    className="absolute bottom-4 right-4 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors duration-300 shadow-md text-sm flex items-center gap-2"
                >
                    <DownloadIcon />
                    Download
                </a>
            </div>
          }
          {!isLoading && !compositeImage && !error && <p className="text-gray-400">Your composite image will appear here</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageCompositor;