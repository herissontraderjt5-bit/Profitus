import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Phone, Lock, User as UserIcon } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register({ username, password, displayName, phone });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00FF00] tracking-tighter mb-2">PROFITUS</h1>
          <p className="text-zinc-400 text-sm">O bot de elite para o mercado Bullex</p>
        </div>

        <div className="flex bg-black rounded-lg p-1 mb-6">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Nome de Usuário" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#00FF00] outline-none transition-colors"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#00FF00] outline-none transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="tel" 
                  placeholder="WhatsApp" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#00FF00] outline-none transition-colors"
                  required
                />
              </div>
            </>
          )}
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#00FF00] outline-none transition-colors"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#00FF00] text-black font-bold py-3 rounded-lg hover:bg-[#00CC00] transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isLogin ? (
              <><LogIn className="w-5 h-5" /> Acessar Robô</>
            ) : (
              <><UserPlus className="w-5 h-5" /> Criar Conta</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
