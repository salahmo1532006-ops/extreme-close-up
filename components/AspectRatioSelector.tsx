
import React from 'react';

interface AspectRatioSelectorProps<T extends string> {
  label: string;
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
}

const AspectRatioSelector = <T extends string,>({ label, options, selected, onSelect }: AspectRatioSelectorProps<T>) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((ratio) => (
          <button
            key={ratio}
            type="button"
            onClick={() => onSelect(ratio)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
              selected === ratio
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
