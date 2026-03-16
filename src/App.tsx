import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { LicenseGate } from './components/LicenseGate';
import { AdminPanel } from './components/AdminPanel';
import { Shield, LayoutDashboard, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00FF00] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (profile?.status === 'blocked') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-3xl text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4 tracking-tight">CONTA BLOQUEADA</h1>
          <p className="text-zinc-400 mb-6">Sua conta foi suspensa por um administrador. Entre em contato com o suporte para mais informações.</p>
          <button 
            onClick={() => window.open('https://wa.me/5569996078041', '_blank')}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            FALAR COM SUPORTE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {profile?.role === 'admin' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-2xl flex gap-2 z-50 shadow-2xl">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'admin' ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </nav>
      )}

      {view === 'dashboard' ? <Dashboard /> : <AdminPanel />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
