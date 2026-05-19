import React from 'react';
import { BedDouble, LogIn, LogOut } from 'lucide-react';
import useStore from '../store/useStore';
import { signInWithGoogle, logout } from '../services/auth';

export default function Header() {
  const { user, setUser, setToken } = useStore();

  const handleLogin = async () => {
    try {
      const { user: authUser, token } = await signInWithGoogle();
      setUser(authUser);
      setToken(token);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  return (
    <>
      <header className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <BedDouble size={20} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 tracking-tight">Price Comparator</h1>
            <p className="text-xs text-slate-400">Find the best deal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                <span className="hidden sm:inline">{user.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </header >
    </>
  );
}
