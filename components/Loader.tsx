
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Processing..." }) => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative w-24 h-24">
      <div className="absolute border-4 border-cyan-500/30 rounded-full w-full h-full"></div>
      <div className="absolute border-4 border-t-cyan-500 rounded-full w-full h-full animate-spin"></div>
    </div>
    <p className="text-cyan-400 font-semibold">{message}</p>
  </div>
);

export default Loader;
