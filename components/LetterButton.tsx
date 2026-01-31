import React from 'react';

interface LetterButtonProps {
  char: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: 'default' | 'correct' | 'ghost' | 'placed';
}

export const LetterButton: React.FC<LetterButtonProps> = ({ 
  char, 
  onClick, 
  disabled = false, 
  size = 'md',
  status = 'default'
}) => {
  
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
  };

  const statusClasses = {
    default: 'bg-white border-b-4 border-gray-200 text-slate-700 active:border-b-0 active:translate-y-1 hover:bg-gray-50 shadow-md',
    correct: 'bg-green-400 border-b-4 border-green-600 text-white shadow-lg animate-bounce',
    ghost: 'bg-gray-200/50 border-2 border-dashed border-gray-300 text-gray-300',
    placed: 'bg-candy-blue border-b-4 border-blue-400 text-white shadow-md'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${statusClasses[status]}
        rounded-2xl font-black flex items-center justify-center transition-all duration-200 select-none
        cursor-pointer
      `}
    >
      {char}
    </button>
  );
};
