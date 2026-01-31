import React from 'react';

interface CategoryCardProps {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ label, icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        ${color} 
        w-full aspect-square rounded-3xl shadow-xl border-b-8 border-black/10
        flex flex-col items-center justify-center gap-4
        transform transition-all active:scale-95 active:border-b-0 active:translate-y-2
        group
      `}
    >
      <span className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{icon}</span>
      <span className="text-2xl font-bold text-slate-800 tracking-wide uppercase">{label}</span>
    </button>
  );
};
