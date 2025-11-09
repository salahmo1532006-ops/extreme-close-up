
import React, { useState } from 'react';
import { Tab } from './types';
import TabButton from './components/TabButton';
import ThinkingMode from './components/ThinkingMode';
import FastResponder from './components/FastResponder';
import AccurateResponder from './components/AccurateResponder';
import ImageStudio from './components/ImageGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import VideoGenerator from './components/VideoGenerator';
import VirtualDP from './components/VirtualDP';
import { BrainIcon, LightningIcon, ImageIcon, VideoIcon, FilmIcon, SearchIcon, AnalyzeIcon } from './components/icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ImageStudio);
  const [masterPrompt, setMasterPrompt] = useState<string>('');

  const renderContent = () => {
    switch (activeTab) {
      case Tab.ThinkingMode:
        return <ThinkingMode masterPrompt={masterPrompt} />;
      case Tab.FastResponder:
        return <FastResponder masterPrompt={masterPrompt} />;
      case Tab.AccurateResponder:
        return <AccurateResponder masterPrompt={masterPrompt} />;
      case Tab.ImageStudio:
        return <ImageStudio masterPrompt={masterPrompt} />;
      case Tab.ImageAnalyzer:
        return <ImageAnalyzer masterPrompt={masterPrompt} />;
      case Tab.VideoGenerator:
        return <VideoGenerator masterPrompt={masterPrompt} />;
      case Tab.VirtualDP:
        return <VirtualDP />;
      default:
        return null;
    }
  };

  const TABS: { id: Tab; icon: React.ReactNode }[] = [
    { id: Tab.ThinkingMode, icon: <BrainIcon /> },
    { id: Tab.ImageStudio, icon: <ImageIcon /> },
    { id: Tab.FastResponder, icon: <LightningIcon /> },
    { id: Tab.AccurateResponder, icon: <SearchIcon /> },
    { id: Tab.ImageAnalyzer, icon: <AnalyzeIcon /> },
    { id: Tab.VirtualDP, icon: <FilmIcon /> },
    { id: Tab.VideoGenerator, icon: <VideoIcon /> },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-900/40 to-gray-900 animated-gradient"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_rgba(100,116,139,0.1),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.1),_transparent_40%)]"></div>
      
      <main className="flex flex-col flex-grow z-10">
        <header className="px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Gemini Multi-Modal Studio
            </h1>
            <nav className="p-1.5 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
                {TABS.map((tab) => (
                    <TabButton
                    key={tab.id}
                    label={tab.id}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    icon={tab.icon}
                    />
                ))}
                </div>
            </nav>
        </header>

        <div className="px-4 md:px-6 pb-4">
          <label htmlFor="master-prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Master Prompt <span className="text-gray-400">(Global prefix for all features)</span>
          </label>
          <textarea
            id="master-prompt"
            rows={2}
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            placeholder="e.g., Use a professional and encouraging tone. All visual outputs should be cinematic."
            className="w-full bg-gray-800/60 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          />
        </div>

        <div className="flex-grow flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
