
import React, { useState, useRef } from 'react';
import { MealType, DailyLog, MealLog, MealSchedule, Language, PresetFood } from '../types';
import { Camera, Plus, Utensils, X, Trash2, Edit2, Save, BookOpen, Search, ArrowRight, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';

// --- Helper: Compress Image (Optimized for Hosting Storage) ---
// Reduces resolution and quality to minimize Base64 string size in JSON DB
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Aggressive compression: Max 500px is enough for mobile viewing
                const MAX_WIDTH = 500; 
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG at 50% quality - Good balance for thumbnail/storage
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

interface DashboardProps {
  currentDate: string;
  dailyLog: DailyLog;
  targetCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
  schedule: MealSchedule;
  presetFoods: PresetFood[];
  onUpdateLog: (log: DailyLog) => void;
  onUpdateSchedule: (schedule: MealSchedule) => void;
  onAddPreset: (food: PresetFood) => void;
  onDeletePreset: (id: string) => void;
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  dailyLog, 
  targetCalories, 
  macroRatios,
  schedule, 
  presetFoods,
  onUpdateLog, 
  onAddPreset,
  onDeletePreset,
  lang
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null); // For adding new food (Open Modal)
  const [addMethod, setAddMethod] = useState<'camera' | 'preset' | null>(null); // Sub-state for Add Modal
  const [menuView, setMenuView] = useState<'list' | 'create'>('list'); // Sub-state for Preset Menu
  const [editingMealLog, setEditingMealLog] = useState<MealLog | null>(null); // For editing existing food
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editFormName, setEditFormName] = useState('');
  const [editFormCalories, setEditFormCalories] = useState('');
  const [editFormProtein, setEditFormProtein] = useState('');
  const [editFormCarbs, setEditFormCarbs] = useState('');
  const [editFormFat, setEditFormFat] = useState('');

  // Create Preset Form State
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCal, setNewPresetCal] = useState('');
  const [newPresetPro, setNewPresetPro] = useState('');
  const [newPresetCarb, setNewPresetCarb] = useState('');
  const [newPresetFat, setNewPresetFat] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const MEAL_ORDER = [
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
    MealType.SNACK1,
    MealType.SNACK2,
    MealType.SNACK3,
    MealType.SNACK4
  ];

  // Translation Map
  const t = {
    todayEnergy: lang === 'vi' ? 'Năng lượng hôm nay' : "Today's Energy",
    remaining: lang === 'vi' ? 'Còn lại' : 'Remaining',
    mySchedule: lang === 'vi' ? 'Lịch trình' : 'My Schedule',
    today: lang === 'vi' ? 'Hôm nay' : 'Today',
    editTime: lang === 'vi' ? 'Sửa giờ' : 'Edit time',
    openCamera: lang === 'vi' ? 'Chụp ảnh AI' : 'AI Camera',
    presetMenu: lang === 'vi' ? 'Thực đơn của tôi' : 'My Menu',
    chooseMethod: lang === 'vi' ? 'Chọn cách thêm món' : 'Add Food Method',
    analyzingTitle: lang === 'vi' ? 'Đang tính toán...' : 'Crunching numbers...',
    analyzingSub: lang === 'vi' ? 'AI đang phân tích món ăn' : 'Our AI is analyzing your food',
    deleteConfirm: lang === 'vi' ? 'Xóa món ăn này?' : 'Delete this item?',
    editItem: lang === 'vi' ? 'Chỉnh sửa món ăn' : 'Edit Food Item',
    save: lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes',
    foodName: lang === 'vi' ? 'Tên món' : 'Food Name',
    calories: lang === 'vi' ? 'Calo' : 'Calories',
    addMore: lang === 'vi' ? 'Thêm món' : 'Add Item',
    total: lang === 'vi' ? 'Tổng' : 'Total',
    protein: 'Pro.',
    carbs: 'Carb.',
    fat: 'Fat.',
    searchFood: lang === 'vi' ? 'Tìm món ăn...' : 'Search food...',
    createNew: lang === 'vi' ? 'Tạo món mới' : 'Create New Food',
    createTitle: lang === 'vi' ? 'Tạo Món Mới' : 'Create New Dish',
    addToMenu: lang === 'vi' ? 'Lưu vào thực đơn' : 'Save to Menu',
    back: lang === 'vi' ? 'Quay lại' : 'Back',
    emptyMenu: lang === 'vi' ? 'Chưa có món nào. Tạo mới ngay!' : 'No presets yet. Create one!',
    add: lang === 'vi' ? 'Thêm' : 'Add',
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

  const handleAddMealClick = (type: MealType) => {
    setSelectedMealType(type);
    setAddMethod(null); // Reset choice
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMealType) return;

    setIsAnalyzing(true);
    // Keep reference to type but close modal
    const typeToAdd = selectedMealType;
    setSelectedMealType(null);

    try {
        // Compress image before processing/saving
        const compressedBase64 = await compressImage(file);
        
        // Use the compressed image for analysis (faster upload)
        const analysis = await analyzeFoodImage(compressedBase64);
      
        const newMealLog: MealLog = {
            id: Date.now().toString(),
            type: typeToAdd,
            timestamp: Date.now(),
            completed: true,
            imageUrl: compressedBase64, // Store the SMALL image
            analysis: analysis
        };

        // Append new meal log instead of replacing
        const updatedMeals = [...dailyLog.meals, newMealLog];
        
        const totalCal = updatedMeals.reduce((sum, m) => sum + (m.analysis?.calories || 0), 0);

        onUpdateLog({
            ...dailyLog,
            meals: updatedMeals,
            totalCalories: totalCal
        });
    } catch (error) {
        console.error("Error processing image:", error);
        alert("Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddPresetToLog = (preset: PresetFood) => {
      if (!selectedMealType) return;
      
      const newMealLog: MealLog = {
          id: Date.now().toString(),
          type: selectedMealType,
          timestamp: Date.now(),
          completed: true,
          analysis: {
              foodName: preset.name,
              calories: preset.calories,
              protein: preset.protein,
              carbs: preset.carbs,
              fat: preset.fat,
              confidence: 1
          }
      };

      const updatedMeals = [...dailyLog.meals, newMealLog];
      const totalCal = updatedMeals.reduce((sum, m) => sum + (m.analysis?.calories || 0), 0);
      onUpdateLog({ ...dailyLog, meals: updatedMeals, totalCalories: totalCal });
      
      setSelectedMealType(null); // Close modal
  };

  const handleCreatePreset = () => {
      if (!newPresetName || !newPresetCal) return;
      
      const newFood: PresetFood = {
          id: Date.now().toString(),
          name: newPresetName,
          calories: parseFloat(newPresetCal) || 0,
          protein: parseFloat(newPresetPro) || 0,
          carbs: parseFloat(newPresetCarb) || 0,
          fat: parseFloat(newPresetFat) || 0
      };
      
      onAddPreset(newFood);
      // Reset form
      setNewPresetName('');
      setNewPresetCal('');
      setNewPresetPro('');
      setNewPresetCarb('');
      setNewPresetFat('');
      setMenuView('list');
  };

  const handleDeleteLogById = (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    const updatedMeals = dailyLog.meals.filter(m => m.id !== id);
    const totalCal = updatedMeals.reduce((sum, m) => sum + (m.analysis?.calories || 0), 0);
    onUpdateLog({ ...dailyLog, meals: updatedMeals, totalCalories: totalCal });
  };

  const openEditModal = (log: MealLog) => {
      setEditingMealLog(log);
      setEditFormName(log.analysis?.foodName || '');
      setEditFormCalories(log.analysis?.calories.toString() || '0');
      setEditFormProtein(log.analysis?.protein.toString() || '0');
      setEditFormCarbs(log.analysis?.carbs.toString() || '0');
      setEditFormFat(log.analysis?.fat.toString() || '0');
  };

  const handleSaveEdit = () => {
      if (!editingMealLog) return;
      
      const updatedMeals = dailyLog.meals.map(m => {
          if (m.id === editingMealLog.id) {
              return {
                  ...m,
                  analysis: {
                      ...m.analysis!,
                      foodName: editFormName,
                      calories: parseFloat(editFormCalories) || 0,
                      protein: parseFloat(editFormProtein) || 0,
                      carbs: parseFloat(editFormCarbs) || 0,
                      fat: parseFloat(editFormFat) || 0,
                  }
              };
          }
          return m;
      });

      const totalCal = updatedMeals.reduce((sum, m) => sum + (m.analysis?.calories || 0), 0);
      onUpdateLog({ ...dailyLog, meals: updatedMeals, totalCalories: totalCal });
      setEditingMealLog(null);
  };

  const isCalorieOver = dailyLog.totalCalories > targetCalories;
  const percentage = Math.min(100, Math.round((dailyLog.totalCalories / targetCalories) * 100));

  // --- Macro Calculations ---
  const targetProtein = Math.round((targetCalories * (macroRatios.protein / 100)) / 4);
  const targetCarbs = Math.round((targetCalories * (macroRatios.carbs / 100)) / 4);
  const targetFat = Math.round((targetCalories * (macroRatios.fat / 100)) / 9);

  const currentProtein = Math.round(dailyLog.meals.reduce((acc, m) => acc + (m.analysis?.protein || 0), 0));
  const currentCarbs = Math.round(dailyLog.meals.reduce((acc, m) => acc + (m.analysis?.carbs || 0), 0));
  const currentFat = Math.round(dailyLog.meals.reduce((acc, m) => acc + (m.analysis?.fat || 0), 0));

  // Updated: Allow percentage to exceed 100 for text display
  const getMacroPct = (current: number, target: number) => Math.round((current / (target || 1)) * 100);

  const getMealColor = (index: number) => {
      const colors = [
          'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
          'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
          'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
          'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300',
          'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
          'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300',
          'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300',
      ];
      return colors[index % colors.length];
  };

  const getMealIcon = (type: MealType) => {
    switch (type) {
        case MealType.BREAKFAST: return <Coffee size={20} strokeWidth={2.5} />;
        case MealType.LUNCH: return <Sun size={20} strokeWidth={2.5} />;
        case MealType.DINNER: return <Moon size={20} strokeWidth={2.5} />;
        default: return <Cookie size={18} strokeWidth={2.5} />;
    }
  };

  const filteredPresets = presetFoods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Friendly Wellness Card */}
      <div className="relative bg-friendly-gradient rounded-[2.5rem] p-8 shadow-lg text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-300/30 rounded-full blur-xl -ml-5 -mb-5"></div>

        <div className="relative z-10 w-full space-y-5">
            <div>
                 <div className="flex justify-between items-end mb-2">
                     <h2 className="text-[11px] font-bold uppercase tracking-wider opacity-90">{t.todayEnergy}</h2>
                     <div className="flex items-baseline gap-1">
                        <span className={`text-[32px] font-display font-bold ${isCalorieOver ? 'text-red-200' : ''}`}>{dailyLog.totalCalories}</span>
                        <span className="text-[12px] opacity-80 font-medium tracking-tight">/ {targetCalories} kcal</span>
                    </div>
                 </div>

                <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm p-1">
                    <div 
                        className={`h-full ${isCalorieOver ? 'bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.4)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'} rounded-full transition-all duration-1000 ease-out relative`}
                        style={{ width: `${Math.max(2, percentage)}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
                {/* Macros */}
                {[
                    { label: t.protein, current: currentProtein, target: targetProtein, color: 'bg-blue-300', text: 'text-blue-200' },
                    { label: t.carbs, current: currentCarbs, target: targetCarbs, color: 'bg-orange-300', text: 'text-orange-200' },
                    { label: t.fat, current: currentFat, target: targetFat, color: 'bg-purple-300', text: 'text-purple-200' }
                ].map((macro, idx) => {
                    const isOver = macro.current > macro.target;
                    const pct = getMacroPct(macro.current, macro.target);
                    return (
                        <div key={idx} className={`bg-white/10 backdrop-blur-sm rounded-2xl p-3 border ${isOver ? 'border-red-400/50 bg-red-500/10' : 'border-white/10'} flex flex-col gap-2`}>
                            <div className="flex justify-between items-center text-xs font-bold uppercase">
                                <span className="opacity-80">{macro.label}</span>
                                <span className={isOver ? 'text-red-200' : macro.text}>{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                                {/* Visual bar width still capped at 100% to prevent layout breakage */}
                                <div className={`h-full ${isOver ? 'bg-red-400' : macro.color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                            </div>
                             <div className={`text-[10px] font-medium text-right opacity-90 ${isOver ? 'text-red-200' : ''}`}>
                                {macro.current} / {macro.target}g
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Meal Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">{t.mySchedule}</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{t.today}</span>
        </div>
        
        <div className="space-y-4">
        {MEAL_ORDER.map((mealType, index) => {
          if (!schedule[mealType]?.enabled) return null;

          // Get all logs for this specific meal type
          const mealLogs = dailyLog.meals.filter(m => m.type === mealType);
          const mealTotalCalories = mealLogs.reduce((sum, m) => sum + (m.analysis?.calories || 0), 0);
          
          const scheduledTime = schedule[mealType]?.time || '00:00';
          const colorClass = getMealColor(index);
          const hasLogs = mealLogs.length > 0;

          return (
            <div 
              key={mealType}
              className={`
                rounded-[2rem] p-5 transition-all duration-300
                ${hasLogs 
                  ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700' 
                  : 'bg-white/60 dark:bg-slate-800/60 border border-transparent'
                }
              `}
            >
              {/* Header: Time, Name, Add Button */}
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{scheduledTime}</span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasLogs ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/20' : colorClass}`}>
                            {getMealIcon(mealType)}
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2">
                             <h4 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
                                {t.mealNames[mealType]}
                             </h4>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             {/* Total Cal for this Meal */}
                             {hasLogs && (
                                 <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md">
                                     {t.total}: {mealTotalCalories} kcal
                                 </span>
                             )}
                        </div>
                    </div>
                 </div>

                 {/* Add Button */}
                 <button 
                    onClick={() => handleAddMealClick(mealType)}
                    className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-teal-500 hover:text-white dark:bg-slate-700 dark:hover:bg-teal-500 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                    title={t.addMore}
                 >
                    <Plus size={20} />
                 </button>
              </div>

              {/* Meal Items List */}
              {hasLogs && (
                  <div className="ml-[4rem] space-y-3 mt-4">
                      {mealLogs.map((log) => (
                          <div key={log.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex items-start gap-3 border border-slate-100 dark:border-slate-700/50 group">
                                {/* Image */}
                                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 flex items-center justify-center">
                                    {log.imageUrl ? (
                                        <img src={log.imageUrl} className="w-full h-full object-cover" alt="Food" />
                                    ) : (
                                        <Utensils size={20} className="text-slate-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate pr-2">
                                        {log.analysis?.foodName}
                                    </h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                                        {log.analysis?.calories} kcal
                                    </p>
                                    
                                    {/* Action Buttons (Edit/Delete) */}
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => openEditModal(log)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 size={10} /> {t.editItem}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteLogById(log.id)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ADD MEAL MODAL (CHOICE + SUB-SCREENS) */}
      {selectedMealType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm max-h-[80vh] flex flex-col rounded-[2rem] p-6 shadow-2xl relative">
             <button 
                onClick={() => { setSelectedMealType(null); setAddMethod(null); setMenuView('list'); }}
                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
            >
                <X size={20} />
            </button>

            <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-6 text-center">
                 {selectedMealType && t.mealNames[selectedMealType]}
            </h3>
            
            {/* 1. INITIAL CHOICE SCREEN */}
            {addMethod === null && (
                <div className="grid grid-cols-2 gap-4">
                     {/* Camera Option */}
                     <button 
                        onClick={() => { setAddMethod('camera'); fileInputRef.current?.click(); }}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-teal-50 dark:bg-teal-900/20 rounded-3xl border-2 border-teal-100 dark:border-teal-800 hover:border-teal-500 hover:bg-teal-100 transition-all group"
                     >
                         <div className="w-14 h-14 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                             <Camera size={28} />
                         </div>
                         <span className="font-bold text-teal-700 dark:text-teal-300">{t.openCamera}</span>
                     </button>

                     {/* Preset Menu Option */}
                     <button 
                        onClick={() => setAddMethod('preset')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl border-2 border-orange-100 dark:border-orange-800 hover:border-orange-500 hover:bg-orange-100 transition-all group"
                     >
                         <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                             <BookOpen size={28} />
                         </div>
                         <span className="font-bold text-orange-700 dark:text-orange-300">{t.presetMenu}</span>
                     </button>
                </div>
            )}

            {/* 2. PRESET MENU SCREEN */}
            {addMethod === 'preset' && (
                <div className="flex-1 flex flex-col min-h-0">
                    
                    {/* MENU HEADER */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setAddMethod(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1">
                            <ArrowRight size={12} className="rotate-180" /> {t.back}
                        </button>
                        {menuView === 'list' && (
                            <button onClick={() => setMenuView('create')} className="text-teal-500 text-xs font-bold flex items-center gap-1">
                                <Plus size={14} /> {t.createNew}
                            </button>
                        )}
                         {menuView === 'create' && (
                            <button onClick={() => setMenuView('list')} className="text-slate-400 text-xs font-bold">
                                {t.back}
                            </button>
                        )}
                    </div>

                    {/* VIEW: LIST */}
                    {menuView === 'list' && (
                        <div className="flex-1 flex flex-col min-h-0">
                             {/* Search */}
                             <div className="relative mb-4">
                                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input 
                                    type="text" 
                                    placeholder={t.searchFood} 
                                    className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-orange-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                 />
                             </div>

                             {/* List */}
                             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                 {filteredPresets.length === 0 ? (
                                     <div className="text-center py-8 text-slate-400 text-sm">
                                         {t.emptyMenu}
                                     </div>
                                 ) : (
                                     filteredPresets.map(food => (
                                         <div key={food.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-orange-50 dark:bg-slate-700/50 dark:hover:bg-orange-900/10 border border-transparent hover:border-orange-200 transition-all cursor-pointer">
                                             <div onClick={() => handleAddPresetToLog(food)} className="flex-1">
                                                 <h4 className="font-bold text-slate-700 dark:text-white text-sm">{food.name}</h4>
                                                 <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                     <span className="font-bold text-orange-500">{food.calories} kcal</span>
                                                     <span>•</span>
                                                     <span>P: {food.protein}</span>
                                                     <span>C: {food.carbs}</span>
                                                     <span>F: {food.fat}</span>
                                                 </div>
                                             </div>
                                             <button onClick={() => onDeletePreset(food.id)} className="p-2 text-slate-300 hover:text-red-400 transition-colors">
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                     ))
                                 )}
                             </div>
                        </div>
                    )}

                    {/* VIEW: CREATE NEW */}
                    {menuView === 'create' && (
                         <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                             <h4 className="text-center font-bold text-slate-800 dark:text-white">{t.createTitle}</h4>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t.foodName}</label>
                                 <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-teal-500"
                                    value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t.calories}</label>
                                 <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-teal-500"
                                    value={newPresetCal} onChange={(e) => setNewPresetCal(e.target.value)}
                                 />
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                                 <div>
                                     <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">PRO</label>
                                     <input type="number" className="w-full p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl font-bold text-blue-600 dark:text-blue-300 text-center outline-none"
                                        value={newPresetPro} onChange={(e) => setNewPresetPro(e.target.value)}
                                     />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-bold text-orange-400 uppercase block mb-1">CARB</label>
                                     <input type="number" className="w-full p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl font-bold text-orange-600 dark:text-orange-300 text-center outline-none"
                                        value={newPresetCarb} onChange={(e) => setNewPresetCarb(e.target.value)}
                                     />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-bold text-purple-400 uppercase block mb-1">FAT</label>
                                     <input type="number" className="w-full p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl font-bold text-purple-600 dark:text-purple-300 text-center outline-none"
                                        value={newPresetFat} onChange={(e) => setNewPresetFat(e.target.value)}
                                     />
                                 </div>
                             </div>
                             <button onClick={handleCreatePreset} className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 mt-2">
                                 <Save size={18} /> {t.addToMenu}
                             </button>
                         </div>
                    )}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingMealLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">{t.editItem}</h3>
                 <button 
                    onClick={() => setEditingMealLog(null)}
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500"
                >
                    <X size={18} />
                </button>
             </div>

             <div className="space-y-4">
                 <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t.foodName}</label>
                     <input 
                        type="text" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-teal-500"
                        value={editFormName}
                        onChange={(e) => setEditFormName(e.target.value)}
                     />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{t.calories} (kcal)</label>
                     <input 
                        type="number" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-teal-500"
                        value={editFormCalories}
                        onChange={(e) => setEditFormCalories(e.target.value)}
                     />
                 </div>

                 {/* Macro Edits */}
                 <div className="grid grid-cols-3 gap-3">
                     <div>
                         <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block mb-1">{t.protein} (g)</label>
                         <input 
                            type="number"
                            step="0.1" 
                            className="w-full p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl font-bold text-blue-600 dark:text-blue-300 outline-none border border-transparent focus:border-blue-400 text-center"
                            value={editFormProtein}
                            onChange={(e) => setEditFormProtein(e.target.value)}
                         />
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wide block mb-1">{t.carbs} (g)</label>
                         <input 
                            type="number"
                            step="0.1" 
                            className="w-full p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl font-bold text-orange-600 dark:text-orange-300 outline-none border border-transparent focus:border-orange-400 text-center"
                            value={editFormCarbs}
                            onChange={(e) => setEditFormCarbs(e.target.value)}
                         />
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block mb-1">{t.fat} (g)</label>
                         <input 
                            type="number"
                            step="0.1" 
                            className="w-full p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl font-bold text-purple-600 dark:text-purple-300 outline-none border border-transparent focus:border-purple-400 text-center"
                            value={editFormFat}
                            onChange={(e) => setEditFormFat(e.target.value)}
                         />
                     </div>
                 </div>

                 <button 
                    onClick={handleSaveEdit}
                    className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 mt-2 flex items-center justify-center gap-2"
                 >
                     <Save size={18} /> {t.save}
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
                 <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-1">{t.analyzingTitle}</h3>
            <p className="text-slate-500 text-sm">{t.analyzingSub}</p>
        </div>
      )}
    </div>
  );
};
