
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, LogOut, Shield, Search, Key, X } from 'lucide-react';
import { Language } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
  lang?: Language;
}

interface UserAccount {
  username: string;
  password?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, lang = 'vi' }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const t = {
    adminPanel: lang === 'vi' ? 'Quản trị hệ thống' : 'Admin Panel',
    userList: lang === 'vi' ? 'Danh sách người dùng' : 'User List',
    totalUsers: lang === 'vi' ? 'Tổng người dùng' : 'Total Users',
    search: lang === 'vi' ? 'Tìm kiếm người dùng...' : 'Search users...',
    addUser: lang === 'vi' ? 'Thêm người dùng' : 'Add User',
    deleteConfirm: lang === 'vi' ? 'Cảnh báo: Hành động này sẽ xóa vĩnh viễn tài khoản và toàn bộ dữ liệu sức khỏe của người dùng này. Bạn có chắc chắn không?' : 'Warning: This will permanently delete the account and all associated health data. Are you sure?',
    logout: lang === 'vi' ? 'Đăng xuất' : 'Logout',
    username: lang === 'vi' ? 'Tên đăng nhập' : 'Username',
    password: lang === 'vi' ? 'Mật khẩu' : 'Password',
    cancel: lang === 'vi' ? 'Hủy' : 'Cancel',
    save: lang === 'vi' ? 'Lưu' : 'Save',
    adminRole: lang === 'vi' ? 'Quản trị viên' : 'Administrator',
    cantDeleteAdmin: lang === 'vi' ? 'Không thể xóa tài khoản admin' : 'Cannot delete admin account',
    userExists: lang === 'vi' ? 'Người dùng đã tồn tại' : 'User already exists',
    fillAll: lang === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill all fields',
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const db = JSON.parse(localStorage.getItem('nutrilife_users_db') || '{}');
    const userList = Object.keys(db).map(key => ({
      username: key,
      password: db[key].password // In a real app, never show/store raw passwords
    }));
    setUsers(userList);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'admin') {
      alert(t.cantDeleteAdmin);
      return;
    }

    if (window.confirm(t.deleteConfirm)) {
      // 1. Remove from Auth DB
      const db = JSON.parse(localStorage.getItem('nutrilife_users_db') || '{}');
      delete db[usernameToDelete];
      localStorage.setItem('nutrilife_users_db', JSON.stringify(db));

      // 2. Cleanup User Data (Logs, Profile, etc.)
      // Iterate over all localStorage keys and remove those belonging to this user
      const keysToRemove: string[] = [];
      const prefix = `nutrilife_${usernameToDelete}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Reload list
      loadUsers();
    }
  };

  const handleAddUser = () => {
    if (!newUsername || !newPassword) {
      alert(t.fillAll);
      return;
    }

    const db = JSON.parse(localStorage.getItem('nutrilife_users_db') || '{}');
    if (db[newUsername]) {
      alert(t.userExists);
      return;
    }

    db[newUsername] = { password: newPassword };
    localStorage.setItem('nutrilife_users_db', JSON.stringify(db));

    setIsAdding(false);
    setNewUsername('');
    setNewPassword('');
    loadUsers();
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 font-sans p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <header className="bg-slate-900 text-white p-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">{t.adminPanel}</h1>
              <p className="text-slate-400 text-sm">{t.adminRole}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} /> {t.logout}
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-8">
          
          {/* Stats & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase block">{t.totalUsers}</span>
              <span className="text-3xl font-display font-bold text-slate-800">{users.length}</span>
            </div>

            <div className="flex-1 w-full md:w-auto flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder={t.search}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:border-teal-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
              >
                <Plus size={20} /> <span className="hidden md:inline">{t.addUser}</span>
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div key={user.username} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between group hover:border-teal-200 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${user.username === 'admin' ? 'bg-purple-500' : 'bg-slate-300'}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{user.username}</h3>
                      {/* Only show password for demo purposes/admin ease */}
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Key size={10} /> {user.password}
                      </p>
                    </div>
                  </div>
                  
                  {user.username !== 'admin' && (
                    <button 
                      onClick={() => handleDeleteUser(user.username)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{t.addUser}</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">{t.username}</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 border border-slate-100 focus:border-teal-500 outline-none"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">{t.password}</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 border border-slate-100 focus:border-teal-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddUser}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold mt-2 shadow-lg shadow-teal-500/30"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
