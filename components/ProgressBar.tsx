
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  const stepLabels = [
    "Località",
    "Superfici",
    "Tecnico",
    "Contatti"
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-4">
        {stepLabels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300 border-2 ${
                  isCurrent 
                    ? 'bg-[#d8d900] text-[#2e62ab] border-[#d8d900]' 
                    : isCompleted 
                      ? 'bg-[#80c080] text-[#fff] border-[#80c080]' 
                      : 'bg-white/10 text-white/50 border-white/20'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${
                isCurrent ? 'text-white' : 'text-white/40'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
