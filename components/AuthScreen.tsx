
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, Leaf } from 'lucide-react';
import { Language } from '../types';

interface AuthScreenProps {
  onLogin: (username: string) => void;
  lang?: Language;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, lang = 'vi' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    welcome: 'Xin chào Serena! 👋',
    subtitle: 'Chào mừng bạn quay trở lại.',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    login: 'Đăng nhập',
    errorEmpty: 'Vui lòng điền đầy đủ thông tin',
    errorInvalid: 'Sai tên đăng nhập hoặc mật khẩu',
    secureDb: 'Dữ liệu được bảo mật riêng tư',
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);

    // Simulate network delay for UX
    setTimeout(() => {
      // Hardcoded credentials as requested
      if (username === 'Serena' && password === '232523') {
        onLogin(username);
      } else {
        setError(t.errorInvalid);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 font-sans">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Decor */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-100/50 rounded-full -mr-12 -mt-12 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100/50 rounded-full -ml-12 -mb-12 blur-3xl"></div>

        <div className="relative z-10">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30 transform -rotate-6">
                    <Leaf size={40} />
                </div>
                <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-2">
                    {t.welcome}
                </h1>
                <p className="text-slate-500 font-medium">{t.subtitle}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.username}</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Nhập tên đăng nhập..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block">{t.password}</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold text-center animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-teal-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/30 hover:bg-teal-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>{t.login}</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <ShieldCheck size={14} className="text-teal-500" />
                {t.secureDb}
            </div>
        </div>
      </div>
    </div>
  );
};
