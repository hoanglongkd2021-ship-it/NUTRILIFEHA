
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DailyLog, WeightHistory, MealSchedule, MealType, Language, PresetFood } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { DailyTracker } from './components/DailyTracker';
import { WeightTracker } from './components/WeightTracker';
import { AuthScreen } from './components/AuthScreen';
import { CloudService } from './services/cloudService';
import { LocalService } from './services/localService'; // Import Local Service
import { LayoutDashboard, PieChart, User, List, Scale, Moon, Sun, Globe, ChevronRight, AlertCircle, Lock, LogOut, Download, UploadCloud, Database, RefreshCw, Cloud, Smartphone } from 'lucide-react';

// --- Authenticated App Component ---
interface AuthenticatedAppProps {
    currentUser: string;
    onLogout: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ currentUser, onLogout }) => {
  // --- Helper: Get Local Date YYYY-MM-DD ---
  const getLocalTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getKey = (key: string) => `nutrilife_${currentUser}_${key}`;

  // --- State ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'weight' | 'reports' | 'profile'>('dashboard');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [presetFoods, setPresetFoods] = useState<PresetFood[]>([]);
  const [todayDate, setTodayDate] = useState<string>(getLocalTodayDate());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('vi');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local_saved'>('synced');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [schedule, setSchedule] = useState<MealSchedule>({
    [MealType.BREAKFAST]: { time: '07:00', enabled: true },
    [MealType.SNACK1]: { time: '10:00', enabled: true },
    [MealType.LUNCH]: { time: '12:30', enabled: true },
    [MealType.SNACK2]: { time: '16:00', enabled: true },
    [MealType.SNACK3]: { time: '15:00', enabled: false },
    [MealType.DINNER]: { time: '19:00', enabled: true },
    [MealType.SNACK4]: { time: '21:00', enabled: false },
  });

  // --- INITIALIZATION: LOCAL FIRST, THEN CLOUD CHECK ---
  useEffect(() => {
      const initApp = async () => {
          // 1. Load from Local Storage IMMEDIATELY (Fastest)
          const localData = LocalService.getUserData(currentUser);
          
          if (localData) {
              console.log("Loaded data from Local Cache");
              setProfile(localData.profile);
              setLogs(localData.logs);
              setWeightHistory(localData.weightHistory);
              setSchedule(localData.schedule);
              setPresetFoods(localData.presetFoods);
          }

          // 2. Check Cloud in Background (Async)
          // "Stale-While-Revalidate" strategy
          try {
              setSyncStatus('syncing');
              const cloudData = await CloudService.getUserData(currentUser);
              
              if (cloudData) {
                  // Compare timestamps. If Cloud is newer than Local, update UI.
                  // We give a small buffer (500ms) to avoid ping-pong on slight clock diffs
                  const localTime = localData?.lastSynced || 0;
                  
                  if (cloudData.lastSynced > localTime + 500) {
                      console.log("Found newer data on Cloud. Updating...");
                      setProfile(cloudData.profile);
                      setLogs(cloudData.logs);
                      setWeightHistory(cloudData.weightHistory);
                      setSchedule(cloudData.schedule);
                      setPresetFoods(cloudData.presetFoods);
                      
                      // Also update local cache immediately with this new cloud data
                      LocalService.saveUserData(currentUser, {
                          profile: cloudData.profile,
                          logs: cloudData.logs,
                          weightHistory: cloudData.weightHistory,
                          schedule: cloudData.schedule,
                          presetFoods: cloudData.presetFoods,
                          lastSynced: cloudData.lastSynced
                      });
                  } else {
                      console.log("Local data is up to date.");
                  }
              }
          } catch (e) {
              console.error("Background Cloud Check failed:", e);
              // It's okay, we have local data
          } finally {
              setSyncStatus('synced');
              setIsInitialLoad(false);
          }
      };

      // Load specific preferences
      const savedTheme = localStorage.getItem(getKey('theme')) as 'light' | 'dark';
      const savedLang = localStorage.getItem(getKey('lang')) as Language;
      if (savedTheme) setTheme(savedTheme);
      if (savedLang) setLanguage(savedLang);

      initApp();
  }, [currentUser]);

  // Theme & Lang persistence
  useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem(getKey('theme'), theme);
  }, [theme, currentUser]);

  useEffect(() => {
    localStorage.setItem(getKey('lang'), language);
  }, [language, currentUser]);


  // --- DATA CHANGE HANDLER: SAVE LOCAL & CLOUD IMMEDIATELY ---
  useEffect(() => {
      if (isInitialLoad) return;

      const timestamp = Date.now();
      
      // 1. SAVE LOCAL (Synchronous - Blocking but fast)
      // We prioritize user input, so we save locally instantly.
      LocalService.saveUserData(currentUser, {
          profile,
          logs,
          weightHistory,
          schedule,
          presetFoods,
          lastSynced: timestamp
      });

      // 2. SAVE CLOUD (Async - Immediate)
      // Removed debounce to satisfy "immediate" requirement
      const syncToCloud = async () => {
          setSyncStatus('syncing');
          const success = await CloudService.saveUserData(currentUser, {
              profile,
              logs,
              weightHistory,
              schedule,
              presetFoods
          });
          if (success) {
            setSyncStatus('synced');
          } else {
              setSyncStatus('local_saved'); 
          }
      };

      syncToCloud();

  }, [profile, logs, weightHistory, schedule, presetFoods, currentUser, isInitialLoad]);


  // --- Real-time Date Checker ---
  useEffect(() => {
    const checkDate = () => {
        const current = getLocalTodayDate();
        if (current !== todayDate) {
            setTodayDate(current);
        }
    };
    checkDate();
    const intervalId = setInterval(checkDate, 60000);
    return () => clearInterval(intervalId);
  }, [todayDate]);


  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'vi' ? 'en' : 'vi');

  // --- Handlers ---
  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setWeightHistory([{ date: todayDate, weight: newProfile.weight, timestamp: Date.now(), id: Date.now().toString() }]);
  };

  const handleUpdateLog = (updatedLog: DailyLog) => {
    const otherLogs = logs.filter(l => l.date !== updatedLog.date);
    setLogs([...otherLogs, updatedLog]);
  };

  const handleUpdateWeight = (newWeight: number) => {
    if (!profile) return;
    const updatedProfile = { ...profile, weight: newWeight };
    setProfile(updatedProfile);
    const newEntry: WeightHistory = {
        id: Date.now().toString(),
        date: todayDate,
        timestamp: Date.now(),
        weight: newWeight
    };
    setWeightHistory([...weightHistory, newEntry]);
  };

  const handleDeleteWeight = (id: string) => {
      if (!profile) return;
      const updatedHistory = weightHistory.filter(w => w.id !== id);
      setWeightHistory(updatedHistory);
      if (updatedHistory.length > 0) {
          const sorted = [...updatedHistory].sort((a, b) => {
               if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
               return new Date(b.date).getTime() - new Date(a.date).getTime();
           });
           setProfile({ ...profile, weight: sorted[0].weight });
      }
  };

  const handleUpdateSchedule = (newSchedule: MealSchedule) => {
    setSchedule(newSchedule);
  };

  const handleAddPresetFood = (food: PresetFood) => {
      setPresetFoods([...presetFoods, food]);
  };

  const handleDeletePresetFood = (id: string) => {
      setPresetFoods(presetFoods.filter(f => f.id !== id));
  };

  const toggleMealEnabled = (type: MealType) => {
      setSchedule(prev => ({
          ...prev,
          [type]: { ...prev[type], enabled: !prev[type].enabled }
      }));
  };

  const handleUpdateNutrition = (field: 'calories' | 'protein' | 'carbs', value: string) => {
      if (!profile) return;
      const numValue = value === '' ? 0 : parseFloat(value);

      if (field === 'calories') {
          setProfile({ ...profile, targetCalories: parseInt(value) || 0 });
          return;
      }

      let newProtein = profile.macroRatios.protein;
      let newCarbs = profile.macroRatios.carbs;

      if (field === 'protein') newProtein = numValue;
      if (field === 'carbs') newCarbs = numValue;

      let newFat = 100 - newProtein - newCarbs;
      newFat = Math.round(newFat * 10) / 10;
      if (newFat < 0) newFat = 0;

      setProfile({
          ...profile,
          macroRatios: { protein: newProtein, carbs: newCarbs, fat: newFat }
      });
  };

  // --- Manual Export/Import ---
  const handleExportData = () => {
      const data = {
          profile, logs, weightHistory, schedule, presetFoods, timestamp: Date.now(), user: currentUser
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrilife_backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = event.target?.result as string;
              const data = JSON.parse(json);
              if (window.confirm(language === 'vi' ? 'Dữ liệu cũ sẽ bị ghi đè. Tiếp tục?' : 'Overwrite current data?')) {
                  if (data.profile) setProfile(data.profile);
                  if (data.logs) setLogs(data.logs);
                  if (data.weightHistory) setWeightHistory(data.weightHistory);
                  if (data.schedule) setSchedule(data.schedule);
                  if (data.presetFoods) setPresetFoods(data.presetFoods);
                  alert(language === 'vi' ? 'Thành công!' : 'Success!');
              }
          } catch (err) { alert('Error!'); }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const currentDailyLog = logs.find(l => l.date === todayDate) || {
    date: todayDate,
    meals: [],
    totalCalories: 0
  };

  if (isInitialLoad && !profile) {
      // If we have absolutely no data (not even local), show loading
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 gap-4">
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse">
                  {language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}
              </p>
          </div>
      );
  }

  if (!profile || !profile.setupComplete) {
    return <Onboarding onComplete={handleProfileComplete} lang={language} />;
  }

  const t = {
    // ... existing translations ...
    hello: language === 'vi' ? 'Xin chào' : 'Hello',
    syncing: language === 'vi' ? 'Đang đồng bộ...' : 'Syncing...',
    synced: language === 'vi' ? 'Đã đồng bộ Cloud' : 'Cloud Synced',
    localSaved: language === 'vi' ? 'Đã lưu trên máy' : 'Saved to device',
    // ... (Use existing keys for compactness in this code block, but logic is same)
    preferences: language === 'vi' ? 'Cài đặt chung' : 'Preferences',
    dataManage: language === 'vi' ? 'Quản lý dữ liệu' : 'Data Management',
    mealConfig: language === 'vi' ? 'Cấu hình bữa ăn' : 'Meal Configuration',
    nutritionGoals: language === 'vi' ? 'Mục tiêu Dinh dưỡng' : 'Nutrition Goals',
    personalInfo: language === 'vi' ? 'Thông tin cá nhân' : 'Personal Info',
    appTheme: language === 'vi' ? 'Giao diện' : 'App Theme',
    darkMode: language === 'vi' ? 'Tối' : 'Dark Mode',
    lightMode: language === 'vi' ? 'Sáng' : 'Light Mode',
    language: language === 'vi' ? 'Ngôn ngữ' : 'Language',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    height: language === 'vi' ? 'Chiều cao' : 'Height',
    weight: language === 'vi' ? 'Cân nặng' : 'Weight',
    targetCal: language === 'vi' ? 'Mục tiêu Calo' : 'Target Calories',
    macros: language === 'vi' ? 'Tỷ lệ Macros' : 'Macro Ratios',
    protein: 'Protein',
    carbs: language === 'vi' ? 'Đường bột' : 'Carbs',
    fat: language === 'vi' ? 'Chất béo' : 'Fat',
    errorTotal: language === 'vi' ? 'Tổng > 100%' : 'Total > 100%',
    logout: language === 'vi' ? 'Đăng xuất' : 'Sign Out',
    backup: language === 'vi' ? 'Sao lưu dữ liệu' : 'Backup Data',
    restore: language === 'vi' ? 'Khôi phục dữ liệu' : 'Restore Data',
    syncDesc: language === 'vi' ? 'Chuyển dữ liệu sang thiết bị khác' : 'Transfer data to another device',
    mealNames: {
        [MealType.BREAKFAST]: language === 'vi' ? 'Bữa sáng' : 'Breakfast',
        [MealType.LUNCH]: language === 'vi' ? 'Bữa trưa' : 'Lunch',
        [MealType.DINNER]: language === 'vi' ? 'Bữa tối' : 'Dinner',
        [MealType.SNACK1]: language === 'vi' ? 'Ăn nhẹ 1' : 'Snack 1',
        [MealType.SNACK2]: language === 'vi' ? 'Ăn nhẹ 2' : 'Snack 2',
        [MealType.SNACK3]: language === 'vi' ? 'Ăn nhẹ 3' : 'Snack 3',
        [MealType.SNACK4]: language === 'vi' ? 'Ăn nhẹ 4' : 'Snack 4',
    }
  };

  return (
    // UPDATED: Removed "items-center" and added "items-start" for mobile. Kept "sm:items-center" for desktop.
    // This pushes the app to the very top on mobile devices, removing the gap.
    <div className="min-h-screen font-sans text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 flex items-start sm:items-center justify-center p-0 sm:p-6 transition-colors duration-300">
      {/* 
          UPDATED CONTAINER LOGIC: 
          - Mobile (< sm): w-full, h-[100dvh], no border, no radius.
          - Desktop (>= sm): max-w-[420px], h-[850px], radius, border.
      */}
      <div className="w-full sm:max-w-[420px] h-[100dvh] sm:h-[850px] bg-slate-50 dark:bg-slate-950 relative sm:rounded-[2.5rem] shadow-2xl sm:border-[8px] sm:border-white dark:sm:border-slate-800 overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Mobile Status Bar - PUSHED UP TO MAXIMIZE SPACE (No Safe Top Padding) */}
        <div className="w-full bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-40 border-b border-transparent dark:border-slate-800/50">
            {/* Reduced pt-4 to pt-2 to push content further up as requested */}
            <header className="px-6 pt-2 pb-2 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-teal-500 uppercase tracking-wide mb-0.5">{t.hello}, {profile.name}</p>
                <h1 className="text-2xl font-display font-extrabold text-slate-800 dark:text-white tracking-tight">
                    NutriLife<span className="text-teal-500">.</span>
                </h1>
            </div>
            
            {/* Intelligent Sync Indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 ${
                syncStatus === 'syncing' 
                ? 'bg-blue-50 border-blue-100 text-blue-600' 
                : syncStatus === 'local_saved'
                ? 'bg-orange-50 border-orange-100 text-orange-600'
                : 'bg-green-50 border-green-100 text-green-600'
            }`}>
                {syncStatus === 'syncing' && <RefreshCw size={10} className="animate-spin" />}
                {syncStatus === 'local_saved' && <Smartphone size={10} />}
                {syncStatus === 'synced' && <Cloud size={10} />}
                
                <span className="text-[9px] font-bold">
                    {syncStatus === 'syncing' ? t.syncing : syncStatus === 'local_saved' ? t.localSaved : t.synced}
                </span>
            </div>

            </header>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-safe-bottom">
            <main className="px-6 pt-2 pb-36">
            {activeTab === 'dashboard' && (
                <Dashboard 
                currentDate={todayDate}
                dailyLog={currentDailyLog}
                targetCalories={profile.targetCalories}
                macroRatios={profile.macroRatios}
                schedule={schedule}
                presetFoods={presetFoods}
                onUpdateLog={handleUpdateLog}
                onUpdateSchedule={handleUpdateSchedule}
                onAddPreset={handleAddPresetFood}
                onDeletePreset={handleDeletePresetFood}
                lang={language}
                />
            )}
            
            {activeTab === 'tracker' && (
                <DailyTracker 
                    dailyLog={currentDailyLog} 
                    targetCalories={profile.targetCalories}
                    macroRatios={profile.macroRatios}
                    lang={language} 
                />
            )}

            {activeTab === 'weight' && (
                <WeightTracker 
                currentWeight={profile.weight}
                height={profile.height}
                history={weightHistory}
                onUpdateWeight={handleUpdateWeight}
                onDeleteWeight={handleDeleteWeight}
                lang={language}
                />
            )}
            
            {activeTab === 'reports' && (
                <Reports 
                logs={logs}
                weightHistory={weightHistory}
                targetCalories={profile.targetCalories}
                macroRatios={profile.macroRatios}
                lang={language}
                />
            )}

            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                     {/* Nutrition Settings */}
                     <div className="space-y-3">
                        <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.nutritionGoals}</h3>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">{t.targetCal}</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-lg font-bold text-slate-800 dark:text-white outline-none border border-slate-100 dark:border-slate-600 focus:border-teal-500 transition-colors"
                                        value={profile.targetCalories || ''}
                                        onChange={(e) => handleUpdateNutrition('calories', e.target.value)}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kcal</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.macros} (%)</label>
                                    {(profile.macroRatios.protein + profile.macroRatios.carbs) > 100 && (
                                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                            <AlertCircle size={10} /> {t.errorTotal}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                step="0.1"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 text-center font-bold text-blue-600 dark:text-blue-300 outline-none border border-transparent focus:border-blue-400 placeholder:text-blue-200"
                                                value={profile.macroRatios.protein === 0 ? '' : profile.macroRatios.protein}
                                                onChange={(e) => handleUpdateNutrition('protein', e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 text-center mt-1">{t.protein}</p>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                step="0.1"
                                                className="w-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2 text-center font-bold text-orange-600 dark:text-orange-300 outline-none border border-transparent focus:border-orange-400 placeholder:text-orange-200"
                                                value={profile.macroRatios.carbs === 0 ? '' : profile.macroRatios.carbs}
                                                onChange={(e) => handleUpdateNutrition('carbs', e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 text-center mt-1">{t.carbs}</p>
                                    </div>
                                    <div className="opacity-80">
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                readOnly
                                                className="w-full bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 text-center font-bold text-purple-600 dark:text-purple-300 outline-none border border-transparent cursor-not-allowed"
                                                value={profile.macroRatios.fat}
                                            />
                                            <div className="absolute top-1 right-1">
                                                <Lock size={8} className="text-purple-400"/>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 text-center mt-1">{t.fat}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>

                     {/* Meal Config */}
                    <div className="space-y-3">
                        <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.mealConfig}</h3>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            {[
                                MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, 
                                MealType.SNACK1, MealType.SNACK2, MealType.SNACK3, MealType.SNACK4
                            ].map((mealType, index, arr) => (
                                <div 
                                    key={mealType}
                                    className={`flex items-center justify-between p-4 ${index !== arr.length - 1 ? 'border-b border-slate-50 dark:border-slate-700' : ''}`}
                                >
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{t.mealNames[mealType]}</span>
                                    <button 
                                        onClick={() => toggleMealEnabled(mealType)}
                                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${schedule[mealType]?.enabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${schedule[mealType]?.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-3">
                         <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.personalInfo}</h3>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-soft border border-slate-100 dark:border-slate-700 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                                <span className="text-3xl font-display font-bold">
                                    {profile.name.charAt(0)}
                                </span>
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-1">{profile.name}</h2>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">{t.height}</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{profile.height} cm</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">{t.weight}</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{profile.weight} kg</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manual Backup */}
                    <div className="space-y-3">
                         <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dataManage}</h3>
                         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500">
                                     <Database size={20} />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-800 dark:text-white">{t.backup} & {t.restore}</h4>
                                     <p className="text-xs text-slate-500">{t.syncDesc}</p>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                 <button 
                                    onClick={handleExportData}
                                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-600 border border-slate-100 dark:border-slate-600"
                                 >
                                     <Download size={16} />
                                     <span className="text-xs uppercase tracking-wide">{t.backup}</span>
                                 </button>
                                 <button 
                                    onClick={handleImportClick}
                                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-600 border border-slate-100 dark:border-slate-600"
                                 >
                                     <UploadCloud size={16} />
                                     <span className="text-xs uppercase tracking-wide">{t.restore}</span>
                                 </button>
                             </div>
                             <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                         </div>
                    </div>

                    {/* Preferences & Logout */}
                    <div className="space-y-3">
                        <h3 className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.preferences}</h3>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{t.appTheme}</p>
                                        <p className="text-xs text-slate-500">{theme === 'dark' ? t.darkMode : t.lightMode}</p>
                                    </div>
                                </div>
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </button>

                            <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center"><Globe size={20} /></div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{t.language}</p>
                                        <p className="text-xs text-slate-500">{language === 'vi' ? t.vietnamese : t.english}</p>
                                    </div>
                                </div>
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${language === 'en' ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${language === 'en' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </button>

                             <button onClick={onLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center"><LogOut size={20} /></div>
                                    <p className="font-bold text-red-500 dark:text-red-400">{t.logout}</p>
                                </div>
                                <ChevronRight size={20} className="text-slate-300" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>

        {/* Nav Bar */}
        <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md pb-safe-bottom">
             <nav className="bg-white dark:bg-slate-800 rounded-full shadow-float px-2 py-3 flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                {[{ id: 'dashboard', icon: LayoutDashboard }, { id: 'tracker', icon: List }, { id: 'weight', icon: Scale }, { id: 'reports', icon: PieChart }, { id: 'profile', icon: User }].map((item) => (
                    <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`relative transition-all duration-300 group flex-1 flex justify-center ${activeTab === item.id ? 'text-teal-500 scale-110' : 'text-slate-400'}`}
                    >
                    <item.icon size={26} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    {activeTab === item.id && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"></span>}
                    </button>
                ))}
            </nav>
        </div>
        
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('nutrilife_current_user');
        if (savedUser) setUser(savedUser);
    }, []);

    const handleLogin = (username: string) => {
        setUser(username);
        localStorage.setItem('nutrilife_current_user', username);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nutrilife_current_user');
    };

    if (!user) return <AuthScreen onLogin={handleLogin} />;
    return <AuthenticatedApp key={user} currentUser={user} onLogout={handleLogout} />;
};

export default App;
