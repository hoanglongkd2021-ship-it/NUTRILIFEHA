import React from 'react';
import { DailyLog, Language, MealType } from '../types';
import { Flame, Droplet, Wheat, Dumbbell, Utensils } from 'lucide-react';

interface DailyTrackerProps {
  dailyLog: DailyLog;
  targetCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
  lang: Language;
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({ dailyLog, targetCalories, macroRatios, lang }) => {
  const completedMeals = dailyLog.meals.filter(m => m.completed && m.analysis);
  const sortedMeals = [...completedMeals].sort((a, b) => b.timestamp - a.timestamp);

  const totalProtein = completedMeals.reduce((acc, m) => acc + (m.analysis?.protein || 0), 0);
  const totalCarbs = completedMeals.reduce((acc, m) => acc + (m.analysis?.carbs || 0), 0);
  const totalFat = completedMeals.reduce((acc, m) => acc + (m.analysis?.fat || 0), 0);

  // Calculate Targets in Grams
  const targetProtein = Math.round((targetCalories * (macroRatios.protein / 100)) / 4);
  const targetCarbs = Math.round((targetCalories * (macroRatios.carbs / 100)) / 4);
  const targetFat = Math.round((targetCalories * (macroRatios.fat / 100)) / 9);

  const t = {
      nutrition: lang === 'vi' ? 'Dinh dưỡng' : 'Nutrition',
      today: lang === 'vi' ? 'Hôm nay' : 'Today',
      protein: 'Protein',
      carbs: lang === 'vi' ? 'Đường bột' : 'Carbs',
      fat: lang === 'vi' ? 'Chất béo' : 'Fat',
      foodLog: lang === 'vi' ? 'Nhật ký ăn uống' : 'Food Log',
      noMeals: lang === 'vi' ? 'Chưa có món ăn nào' : 'No meals logged yet.',
      trackStart: lang === 'vi' ? 'Hãy ghi lại bữa sáng để bắt đầu!' : 'Track your breakfast to start!',
      mealNames: {
        [MealType.BREAKFAST]: lang === 'vi' ? 'Bữa sáng' : 'Breakfast',
        [MealType.LUNCH]: lang === 'vi' ? 'Bữa trưa' : 'Lunch',
        [MealType.DINNER]: lang === 'vi' ? 'Bữa tối' : 'Dinner',
        [MealType.SNACK1]: lang === 'vi' ? 'Ăn nhẹ 1' : 'Snack 1',
        [MealType.SNACK2]: lang === 'vi' ? 'Ăn nhẹ 2' : 'Snack 2',
        [MealType.SNACK3]: lang === 'vi' ? 'Ăn nhẹ 3' : 'Snack 3',
        [MealType.SNACK4]: lang === 'vi' ? 'Ăn nhẹ 4' : 'Snack 4',
    }
  };

  const renderMacroCard = (
      icon: React.ReactNode, 
      label: string, 
      current: number, 
      target: number, 
      colorClass: string,
      bgClass: string,
      borderClass: string
    ) => {
      const isOver = current > target;
      return (
        <div className={`${bgClass} p-4 rounded-3xl border ${borderClass} flex flex-col items-center relative overflow-hidden`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} bg-white/50 mb-2`}>
                 {icon}
             </div>
             <div className="flex items-baseline gap-1">
                 <span className={`text-xl font-bold ${isOver ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {Math.round(current)}
                 </span>
                 <span className="text-xs font-bold text-slate-400">/ {target}g</span>
             </div>
             <span className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${isOver ? 'text-red-500' : 'opacity-60'}`}>{label}</span>
             
             {/* Progress Bar Background */}
             <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5">
                <div 
                    className={`h-full ${isOver ? 'bg-red-500' : colorClass.replace('text-', 'bg-')}`} 
                    style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                ></div>
             </div>
         </div>
      );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      <div className="flex items-baseline justify-between px-2">
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{t.nutrition}</h2>
          <span className="text-sm font-bold text-teal-500">{t.today}</span>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
         {renderMacroCard(
             <Dumbbell size={18} />, 
             t.protein, 
             totalProtein, 
             targetProtein, 
             'text-blue-500', 
             'bg-blue-50 dark:bg-blue-900/20', 
             'border-blue-100 dark:border-blue-900/30'
         )}
         {renderMacroCard(
             <Wheat size={18} />, 
             t.carbs, 
             totalCarbs, 
             targetCarbs, 
             'text-orange-500', 
             'bg-orange-50 dark:bg-orange-900/20', 
             'border-orange-100 dark:border-orange-900/30'
         )}
         {renderMacroCard(
             <Droplet size={18} />, 
             t.fat, 
             totalFat, 
             targetFat, 
             'text-purple-500', 
             'bg-purple-50 dark:bg-purple-900/20', 
             'border-purple-100 dark:border-purple-900/30'
         )}
      </div>

      {/* Food Log List */}
      <div className="space-y-4">
        <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.foodLog}</h3>
        
        {sortedMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <Utensils size={24} />
                </div>
                <p className="font-medium text-slate-400">{t.noMeals}</p>
                <p className="text-xs text-slate-400">{t.trackStart}</p>
            </div>
        ) : (
            sortedMeals.map((meal) => (
            <div key={meal.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    {meal.imageUrl ? (
                         <img src={meal.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Flame size={20} />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                         <div>
                             <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">{t.mealNames[meal.type]}</span>
                             <h4 className="font-bold text-slate-800 dark:text-white truncate">{meal.analysis?.foodName}</h4>
                         </div>
                         <div className="text-right">
                             <span className="block font-bold text-slate-800 dark:text-white">{meal.analysis?.calories}</span>
                             <span className="text-[10px] text-slate-400">kcal</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span className="text-xs text-slate-500">{Math.round(meal.analysis?.protein || 0)}p</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            <span className="text-xs text-slate-500">{Math.round(meal.analysis?.carbs || 0)}c</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <span className="text-xs text-slate-500">{Math.round(meal.analysis?.fat || 0)}f</span>
                        </div>
                    </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};