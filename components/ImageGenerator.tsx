
import React, { useState, useCallback, useRef } from 'react';
import { generateEnhancedImage } from '../services/geminiService';
import Loader from './Loader';
import AspectRatioSelector from './AspectRatioSelector';
import type { AspectRatio } from '../types';
import { DownloadIcon, ImageIcon } from './icons';

interface ImageStudioProps {
  masterPrompt: string;
}

const CINEMATIC_STYLES = {
  'Photorealistic': 'photorealistic, 4k, ultra-high resolution, cinematic lighting, sharp focus, detailed. ',
  'None': '',
  'Epic Anamorphic': 'Cinematic, epic, anamorphic lens, lens flares, volumetric god rays, high-contrast dramatic lighting. ',
  'Intimate Macro': 'Macro photography, extreme close-up, shallow DOF, textured details, soft diffused lighting, bokeh background. ',
  'Heroic Portrait': '85mm portrait lens, heroic low-angle, rim lighting, emotional, character focus, creamy bokeh, shallow depth of field. ',
  'Gritty Noir': 'Film noir style, black and white, high contrast, deep shadows, hard key light, dramatic dutch angle, smoky atmosphere. ',
  'Vibrant Neon': 'Cyberpunk aesthetic, vibrant neon lighting, reflections on wet streets, futuristic, moody, cinematic night scene. ',
};
type CinematicStyle = keyof typeof CINEMATIC_STYLES;
type ImageState = { file: File, url: string };

const ImageStudio: React.FC<ImageStudioProps> = ({ masterPrompt }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [cinematicStyle, setCinematicStyle] = useState<CinematicStyle>('Photorealistic');
  
  const [baseImage, setBaseImage] = useState<ImageState | null>(null);
  const [detailImage, setDetailImage] = useState<ImageState | null>(null);

  const [generatedImage, setGeneratedImage] = useState<{ imageUrl: string; fallbackUsed: boolean; } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
    
  const baseFileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const aspectOptions: AspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '3:4'];
  
  const mode = baseImage ? (detailImage ? 'Composite' : 'Edit') : 'Generate';

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<ImageState | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({ file, url: URL.createObjectURL(file) });
      setGeneratedImage(null); // Clear previous results
    }
  };
  
  const removeImage = (setter: React.Dispatch<React.SetStateAction<ImageState | null>>) => {
      setter(null);
      setGeneratedImage(null);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const stylePrefix = CINEMATIC_STYLES[cinematicStyle];
      const masterPrefix = masterPrompt ? `${masterPrompt}\n\n` : '';
      const fullPrompt = `${masterPrefix}${stylePrefix}${prompt}`;

      const result = await generateEnhancedImage(fullPrompt, aspectRatio, baseImage?.file, detailImage?.file);
      setGeneratedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, isLoading, masterPrompt, cinematicStyle, baseImage, detailImage]);

  const ImageInput: React.FC<{
    title: string;
    image: ImageState | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
  }> = ({ title, image, inputRef, onFileChange, onRemove }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg">
        <input type="file" accept="image/*" ref={inputRef} onChange={onFileChange} className="hidden" />
        <label className="text-sm font-medium text-gray-300 mb-2 block">{title}</label>
        {image ? (
            <div className="relative group">
                <img src={image.url} alt={title} className="w-full h-28 object-cover rounded-md" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => inputRef.current?.click()} className="text-white text-xs bg-gray-800/80 px-2 py-1 rounded-md mr-1">Change</button>
                    <button onClick={onRemove} className="text-white text-xs bg-red-600/80 px-2 py-1 rounded-md">Remove</button>
                </div>
            </div>
        ) : (
             <button type="button" onClick={() => inputRef.current?.click()} className="w-full h-28 border-2 border-dashed border-gray-500 rounded-md flex flex-col items-center justify-center hover:border-cyan-500 transition-colors">
                <ImageIcon />
                <span className="text-xs mt-1 text-gray-400">Upload Image</span>
            </button>
        )}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
      <div className="w-full md:w-[420px] flex-shrink-0 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg p-6 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
          <h2 className="text-2xl font-bold text-cyan-400">Image Studio <span className="text-base font-normal text-gray-400">({mode})</span></h2>
          
          <div className="flex-grow space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
              <textarea
                id="prompt"
                rows={mode === 'Generate' ? 4 : 2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic cityscape at dusk..."
                className="w-full bg-gray-700/80 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ImageInput title="Base Image (for Edit/Composite)" image={baseImage} inputRef={baseFileInputRef} onFileChange={handleFileChange(setBaseImage)} onRemove={() => removeImage(setBaseImage)} />
                <ImageInput title="Detail Image (for Composite)" image={detailImage} inputRef={detailFileInputRef} onFileChange={handleFileChange(setDetailImage)} onRemove={() => removeImage(setDetailImage)} />
            </div>

            {mode === 'Generate' && (
              <>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cinematic Styles</label>
                    <div className="flex flex-wrap gap-2">
                    {Object.keys(CINEMATIC_STYLES).map(style => (
                        <button key={style} type="button" onClick={() => setCinematicStyle(style as CinematicStyle)} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${cinematicStyle === style ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {style}
                        </button>
                    ))}
                    </div>
                </div>
                <AspectRatioSelector label="Aspect Ratio" options={aspectOptions} selected={aspectRatio} onSelect={(value) => setAspectRatio(value)} />
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
          >
            {isLoading ? `${mode}ing...` : `${mode} Image`}
          </button>
        </form>
      </div>
      <div className="flex-grow bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg flex justify-center items-center p-6 overflow-hidden relative">
        {isLoading && <Loader message="Creating image..." />}
        {error && <p className="text-red-400 text-center whitespace-pre-wrap">Error: {error}</p>}
        {generatedImage && (
            <div className="relative w-full h-full flex justify-center items-center">
                {generatedImage.fallbackUsed && (
                    <div className="absolute top-4 left-4 right-4 z-10 bg-amber-900/60 backdrop-blur-sm border border-amber-700 text-amber-200 text-xs rounded-lg p-3 shadow-lg">
                        <p><strong className="font-bold">Fallback Activated:</strong> The primary model couldn't generate this image, so we used a powerful alternative.</p>
                    </div>
                )}
                <img src={generatedImage.imageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" />
                <a
                    href={generatedImage.imageUrl}
                    download="generated-image.png"
                    className="absolute bottom-4 right-4 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors duration-300 shadow-md text-sm flex items-center gap-2"
                >
                    <DownloadIcon />
                    Download
                </a>
            </div>
        )}
        {!isLoading && !generatedImage && !error && <p className="text-gray-400 text-center">Your masterpiece will appear here.</p>}
      </div>
    </div>
  );
};

export default ImageStudio;
