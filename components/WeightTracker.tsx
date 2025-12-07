
import React, { useState, useMemo } from 'react';
import { WeightHistory, Language } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Info, Check, Trash2, Clock } from 'lucide-react';

interface WeightTrackerProps {
  currentWeight: number;
  height: number;
  history: WeightHistory[];
  onUpdateWeight: (weight: number) => void;
  onDeleteWeight: (id: string) => void;
  lang: Language;
}

type TimeRange = '1W' | '1M' | '1Y' | 'ALL';

export const WeightTracker: React.FC<WeightTrackerProps> = ({ currentWeight, height, history, onUpdateWeight, onDeleteWeight, lang }) => {
  const [inputValue, setInputValue] = useState(currentWeight.toString());
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const t = {
      bodyMetrics: lang === 'vi' ? 'Chỉ số cơ thể' : 'Body Metrics',
      bmiScore: lang === 'vi' ? 'Chỉ số BMI' : 'BMI Score',
      updateWeight: lang === 'vi' ? 'Cập nhật cân nặng' : 'Update Weight',
      progressTrend: lang === 'vi' ? 'Xu hướng' : 'Progress Trend',
      history: lang === 'vi' ? 'Lịch sử' : 'History',
      startTracking: lang === 'vi' ? 'Bắt đầu theo dõi để xem hành trình của bạn' : 'Start tracking to see your journey',
      underweight: lang === 'vi' ? 'Thiếu cân' : 'Underweight',
      healthy: lang === 'vi' ? 'Bình thường' : 'Healthy',
      overweight: lang === 'vi' ? 'Thừa cân' : 'Overweight',
      obese: lang === 'vi' ? 'Béo phì' : 'Obese',
      week: lang === 'vi' ? '1 Tuần' : '1 Week',
      month: lang === 'vi' ? '1 Tháng' : '1 Month',
      year: lang === 'vi' ? '1 Năm' : '1 Year',
      all: lang === 'vi' ? 'Tất cả' : 'All',
      deleteConfirm: lang === 'vi' ? 'Bạn có chắc muốn xóa bản ghi này?' : 'Delete this weight entry?',
  };

  const bmi = useMemo(() => {
    const heightInMeters = height / 100;
    return (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [currentWeight, height]);

  const getBMIStatus = (bmiValue: string) => {
    const bmiNum = parseFloat(bmiValue);
    if (bmiNum < 18.5) return { label: t.underweight, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' };
    if (bmiNum < 24.9) return { label: t.healthy, color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' };
    if (bmiNum < 29.9) return { label: t.overweight, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' };
    return { label: t.obese, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' };
  };

  const bmiStatus = getBMIStatus(bmi);

  // Filter Data for Chart
  const chartData = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date(0); // Default to epoch (ALL)

    if (timeRange === '1W') {
        cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === '1M') {
        cutoffDate = new Date();
        cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '1Y') {
        cutoffDate = new Date();
        cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    return [...history]
      .filter(w => {
          const wDate = w.timestamp ? new Date(w.timestamp) : new Date(w.date);
          return wDate >= cutoffDate;
      })
      .sort((a, b) => {
          // Sort ascending for chart
          const timeA = a.timestamp || new Date(a.date).getTime();
          const timeB = b.timestamp || new Date(b.date).getTime();
          return timeA - timeB;
      })
      .map(w => {
        const dateObj = w.timestamp ? new Date(w.timestamp) : new Date(w.date);
        
        // Show time if available to indicate real-time recording on chart axis
        const datePart = dateObj.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
        const timePart = w.timestamp ? dateObj.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

        return {
            dateStr: w.date,
            displayDate: timePart ? `${datePart} ${timePart}` : datePart,
            weight: w.weight,
            fullDate: dateObj.toLocaleString()
        };
      });
  }, [history, timeRange, lang]);

  // Full history sorted descending (Newest first)
  const sortedHistory = useMemo(() => {
      return [...history].sort((a, b) => {
          const timeA = a.timestamp || new Date(a.date).getTime();
          const timeB = b.timestamp || new Date(b.date).getTime();
          return timeB - timeA;
      });
  }, [history]);

  const handleSave = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      onUpdateWeight(val);
    }
  };

  const handleDelete = (id: string) => {
      if (window.confirm(t.deleteConfirm)) {
          onDeleteWeight(id);
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      <div className="flex items-end justify-between px-2">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{t.bodyMetrics}</h2>
          <div className="text-right">
             <p className="text-4xl font-display font-bold text-teal-500">{currentWeight}<span className="text-lg text-slate-400 font-medium ml-1">kg</span></p>
          </div>
      </div>

      {/* BMI Card - Friendly */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">{t.bmiScore}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${bmiStatus.color}`}>
                  {bmiStatus.label}
              </span>
          </div>
          <div className="w-px h-10 bg-slate-100 dark:bg-slate-700"></div>
          <div className="text-right">
              <span className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">{bmi}</span>
          </div>
      </div>

      {/* Input Field */}
      <div className="relative bg-white dark:bg-slate-800 p-2 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center pr-2">
            <div className="flex-1 px-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{t.updateWeight}</label>
                <input 
                    type="number" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-transparent font-display text-xl font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-300"
                    placeholder="0.0"
                />
            </div>
            <button 
                onClick={handleSave}
                className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md"
            >
                <Check size={22} strokeWidth={3} />
            </button>
      </div>

      {/* Clean Chart with Range Filters */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
         <div className="mb-4 pl-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <h3 className="text-sm font-bold text-slate-500 uppercase">{t.progressTrend}</h3>
             
             {/* Range Tabs */}
             <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-full flex">
                 {(['1W', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                     <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`
                            px-3 py-1 rounded-full text-[10px] font-bold transition-all
                            ${timeRange === range 
                                ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }
                        `}
                     >
                         {range === '1W' ? '1W' : range === '1M' ? '1M' : range === '1Y' ? '1Y' : t.all}
                     </button>
                 ))}
             </div>
         </div>
         
         <div className="h-56 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                        dataKey="displayDate" 
                        tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        domain={['auto', 'auto']} 
                        hide 
                        padding={{ top: 10, bottom: 10 }}
                    />
                    <Tooltip 
                    contentStyle={{
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        padding: '8px 12px',
                        color: '#334155'
                    }}
                    itemStyle={{ color: '#2dd4bf', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#2dd4bf" 
                    strokeWidth={4}
                    dot={{fill: '#f0fdfa', r: 4, stroke: '#2dd4bf', strokeWidth: 2}}
                    activeDot={{r: 6, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 2}}
                    animationDuration={500}
                    />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-300 italic">
                    {t.startTracking}
                </div>
            )}
         </div>
      </div>

      {/* History List */}
      <div>
         <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 pl-2">{t.history}</h3>
         <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
             {sortedHistory.map((item, index) => {
                 // Determine Date Object for display
                 // Prefer timestamp for accuracy including time
                 const displayDate = item.timestamp ? new Date(item.timestamp) : new Date(item.date);
                 
                 return (
                 <div 
                    key={item.id || index} 
                    className="flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-teal-200 dark:hover:border-teal-900 transition-colors"
                 >
                     <div className="flex flex-col gap-1">
                        {/* Date Display */}
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-sm capitalize">
                            {displayDate.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>

                        {/* Time Display */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Clock size={12} className="text-teal-500" />
                            <span>
                                {item.timestamp 
                                   ? displayDate.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', {hour: '2-digit', minute:'2-digit'}) 
                                   : '--:--'
                                }
                            </span>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-slate-800 dark:text-white">{item.weight} <small className="text-slate-400 font-normal text-xs">kg</small></span>
                        <button 
                            onClick={() => handleDelete(item.id || '')}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                            title="Xóa"
                        >
                            <Trash2 size={16} />
                        </button>
                     </div>
                 </div>
                 );
             })}
         </div>
      </div>
    </div>
  );
};
