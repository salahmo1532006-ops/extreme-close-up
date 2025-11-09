
import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => {
  const baseClasses = "flex items-center justify-center px-4 py-3 font-medium text-sm md:text-base rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const activeClasses = "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30";
  const inactiveClasses = "bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

export default TabButton;
