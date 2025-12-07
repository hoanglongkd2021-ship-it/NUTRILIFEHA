import React, { useMemo, useState } from 'react';
import { DailyLog, WeightHistory, Language } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ReportsProps {
  logs: DailyLog[];
  weightHistory: WeightHistory[];
  targetCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
  lang: Language;
}

type ReportRange = '1W' | '1M' | '1Y';

export const Reports: React.FC<ReportsProps> = ({ logs, weightHistory, targetCalories, macroRatios, lang }) => {
  const [range, setRange] = useState<ReportRange>('1W');

  const t = {
      monthlyOverview: lang === 'vi' ? 'Tổng quan' : 'Overview',
      reports: lang === 'vi' ? 'Báo cáo' : 'Reports',
      calorieIntake: lang === 'vi' ? 'Nạp vào (Kcal)' : 'Calorie Intake',
      noData: lang === 'vi' ? 'Chưa có dữ liệu' : 'No data available yet',
      dailyHistory: lang === 'vi' ? 'Lịch sử năng lượng từng ngày' : 'Daily Energy History',
      weightChange: lang === 'vi' ? 'Thay đổi cân nặng' : 'Weight Change',
      week: lang === 'vi' ? '1 Tuần' : '1 Week',
      month: lang === 'vi' ? '1 Tháng' : '1 Month',
      year: lang === 'vi' ? '1 Năm' : '1 Year',
  };

  // --- Calculate Target Grams ---
  const targetProtein = Math.round((targetCalories * (macroRatios.protein / 100)) / 4);
  const targetCarbs = Math.round((targetCalories * (macroRatios.carbs / 100)) / 4);
  const targetFat = Math.round((targetCalories * (macroRatios.fat / 100)) / 9);

  // --- Filtered Data for Chart ---
  const chartData = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();

    if (range === '1W') cutoffDate.setDate(now.getDate() - 7);
    else if (range === '1M') cutoffDate.setDate(now.getDate() - 30);
    else if (range === '1Y') cutoffDate.setFullYear(now.getFullYear() - 1);

    const filteredLogs = logs
      .filter(l => new Date(l.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // For Year view, aggregate by month
    if (range === '1Y') {
        const monthlyData: Record<string, { total: number, count: number }> = {};
        filteredLogs.forEach(log => {
            const date = new Date(log.date);
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!monthlyData[key]) monthlyData[key] = { total: 0, count: 0 };
            monthlyData[key].total += log.totalCalories;
            monthlyData[key].count += 1;
        });
        return Object.entries(monthlyData).map(([date, data]) => ({
            date,
            calories: Math.round(data.total / data.count), // Average
            target: targetCalories
        }));
    }

    return filteredLogs.map(log => ({
      date: new Date(log.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      calories: log.totalCalories,
      target: targetCalories
    }));
  }, [logs, targetCalories, range]);


  // --- Detailed History List Data ---
  const historyData = useMemo(() => {
      // Sort logs descending (newest first)
      const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return sortedLogs.map(log => {
          const totalProtein = Math.round(log.meals.reduce((acc, m) => acc + (m.analysis?.protein || 0), 0));
          const totalCarbs = Math.round(log.meals.reduce((acc, m) => acc + (m.analysis?.carbs || 0), 0));
          const totalFat = Math.round(log.meals.reduce((acc, m) => acc + (m.analysis?.fat || 0), 0));

          // Calculate Weight Delta
          // 1. Find weight for this date (or closest before it)
          // 2. Find weight for previous entry
          
          // Get weight entries sorted by date asc
          const sortedWeightHistory = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Find the specific weight entry for this log's date (last one if multiple)
          const weightOnDate = sortedWeightHistory.filter(w => w.date === log.date).pop();
          
          // Find the entry strictly before this date (or before the specific entry if it exists)
          let prevWeightEntry;
          if (weightOnDate) {
              const idx = sortedWeightHistory.indexOf(weightOnDate);
              prevWeightEntry = sortedWeightHistory[idx - 1];
          } else {
               // If no weight logged EXACTLY on this day, find the most recent one before it
               prevWeightEntry = sortedWeightHistory.filter(w => new Date(w.date) < new Date(log.date)).pop();
          }

          let weightDelta = null;
          let currentWeight = weightOnDate?.weight;

          if (currentWeight && prevWeightEntry) {
              weightDelta = currentWeight - prevWeightEntry.weight;
          }

          return {
              ...log,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
              weight: currentWeight,
              weightDelta: weightDelta
          };
      });
  }, [logs, weightHistory]);

  const renderDelta = (delta: number | null) => {
      if (delta === null) return <span className="text-slate-300 text-[10px]">-</span>;
      if (delta === 0) return <span className="text-slate-400 text-[10px] flex items-center"><Minus size={10} /> 0</span>;
      const isUp = delta > 0;
      return (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isUp ? 'text-red-500' : 'text-teal-500'}`}>
              {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(delta).toFixed(1)}kg
          </span>
      );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      <div className="px-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider text-teal-500 uppercase mb-1">{t.monthlyOverview}</p>
            <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{t.reports}</h2>
          </div>
          
          {/* Time Range Selector */}
          <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-full flex">
             {(['1W', '1M', '1Y'] as ReportRange[]).map((r) => (
                 <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`
                        px-3 py-1 rounded-full text-[10px] font-bold transition-all
                        ${range === r
                            ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }
                    `}
                 >
                     {r === '1W' ? t.week : r === '1M' ? t.month : t.year}
                 </button>
             ))}
         </div>
      </div>

      {/* Calorie Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-500">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t.calorieIntake}</h2>
          </div>
        </div>
        
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                <YAxis hide />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        color: '#334155',
                        padding: '12px',
                        fontSize: '12px'
                    }}
                />
                <Bar 
                    dataKey="calories" 
                    fill="#2dd4bf" 
                    radius={[6, 6, 6, 6]}
                    barSize={12}
                />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>{t.noData}</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily History List */}
      <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 pl-2">{t.dailyHistory}</h3>
          
          <div className="space-y-4">
              {historyData.map((day) => {
                  const isCalorieOver = day.totalCalories > targetCalories;
                  return (
                      <div key={day.date} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                          {/* Header: Date & Weight */}
                          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50 dark:border-slate-700/50">
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              </span>
                              <div className="flex items-center gap-2">
                                  {day.weight && (
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                          {day.weight}kg
                                      </span>
                                  )}
                                  {day.weight && renderDelta(day.weightDelta)}
                              </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-2">
                              {/* Calories */}
                              <div className="col-span-1 flex flex-col items-center p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Cal</span>
                                  <span className={`text-xs font-bold ${isCalorieOver ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                      {day.totalCalories}
                                  </span>
                                  <span className="text-[9px] text-slate-400">/ {targetCalories}</span>
                              </div>
                              
                              {/* Macros */}
                              <div className="col-span-1 flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                  <span className="text-[10px] font-bold text-blue-500 uppercase">Pro</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{day.protein}</span>
                                  <span className="text-[9px] text-slate-400">/ {targetProtein}</span>
                              </div>
                              <div className="col-span-1 flex flex-col items-center p-2 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
                                  <span className="text-[10px] font-bold text-orange-500 uppercase">Carb</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{day.carbs}</span>
                                  <span className="text-[9px] text-slate-400">/ {targetCarbs}</span>
                              </div>
                              <div className="col-span-1 flex flex-col items-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                                  <span className="text-[10px] font-bold text-purple-500 uppercase">Fat</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{day.fat}</span>
                                  <span className="text-[9px] text-slate-400">/ {targetFat}</span>
                              </div>
                          </div>
                      </div>
                  );
              })}
              
              {historyData.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm italic">
                      {t.noData}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};