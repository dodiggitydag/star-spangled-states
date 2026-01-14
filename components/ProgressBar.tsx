import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto my-4">
      <div className="flex justify-between text-sm font-bold text-patriotic-blue mb-1">
        <span>Progress</span>
        <span>{percentage}% ({current}/{total})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-patriotic-blue">
        <div
          className="bg-patriotic-red h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;