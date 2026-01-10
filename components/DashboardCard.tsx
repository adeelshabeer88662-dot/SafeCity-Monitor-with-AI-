
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps & { onClick?: () => void }> = ({ title, value, trend, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#1E293B]/50 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-slate-800/80 active:scale-95' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-xl text-indigo-400">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
};

export default DashboardCard;
