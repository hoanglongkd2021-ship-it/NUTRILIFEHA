import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import { ArrowRight, Leaf } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  lang: Language;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, lang }) => {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [calories, setCalories] = useState('2000');

  const t = {
    title: lang === 'vi' ? 'Xin chào! 👋' : 'Hello there! 👋',
    subtitle: lang === 'vi' ? 'Hãy thiết lập hồ sơ sức khỏe của bạn.' : "Let's set up your personal wellness profile.",
    nameLabel: lang === 'vi' ? 'Tên của bạn là gì?' : 'What should we call you?',
    namePlaceholder: lang === 'vi' ? 'Tên của bạn' : 'Your Name',
    height: lang === 'vi' ? 'Chiều cao' : 'Height',
    weight: lang === 'vi' ? 'Cân nặng' : 'Weight',
    goal: lang === 'vi' ? 'Mục tiêu Calo hàng ngày' : 'Daily Calorie Goal',
    start: lang === 'vi' ? 'Bắt đầu' : 'Get Started'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !height || !weight) return;

    const profile: UserProfile = {
      name,
      height: parseFloat(height),
      weight: parseFloat(weight),
      targetCalories: parseInt(calories),
      macroRatios: {
        protein: 30,
        carbs: 40,
        fat: 30
      },
      setupComplete: true
    };
    onComplete(profile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 font-sans">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        {/* Soft Blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100 rounded-full -mr-10 -mt-10 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-100 rounded-full -ml-10 -mb-10 blur-3xl opacity-60"></div>
        
        <div className="relative z-10">
            <div className="text-center mb-10">
            <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-2xl mx-auto flex items-center justify-center mb-4 transform rotate-3">
                <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-slate-800 mb-2">{t.title}</h1>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.nameLabel}</label>
                <input
                    type="text"
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.height}</label>
                <div className="relative">
                    <input
                        type="number"
                        required
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                        placeholder="0"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">cm</span>
                </div>
                </div>
                <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.weight}</label>
                <div className="relative">
                    <input
                        type="number"
                        required
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                        placeholder="0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">kg</span>
                </div>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.goal}</label>
                <input
                type="number"
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className="w-full py-4 bg-teal-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/30 hover:bg-teal-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
            >
                <span>{t.start}</span>
                <ArrowRight size={20} />
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};