import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, X } from 'lucide-react';

interface BrokerModalProps {
  onConnect: (email: string, pass: string, type: 'demo' | 'real') => Promise<void>;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({ onConnect }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [type, setType] = useState<'demo' | 'real'>('demo');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConnect(email, pass, type);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[40px] p-10 shadow-[0_0_100px_rgba(0,255,0,0.1)]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#00FF00]/20">
            <Activity className="w-8 h-8 text-[#00FF00]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">CONECTAR BULLEX</h2>
          <p className="text-zinc-500 text-sm">Insira suas credenciais da corretora para sincronizar seu saldo e iniciar as operações.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1 bg-black rounded-2xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => setType('demo')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${type === 'demo' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              CONTA DEMO
            </button>
            <button
              type="button"
              onClick={() => setType('real')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${type === 'real' ? 'bg-[#00FF00] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              CONTA REAL
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-4 mb-1 block">E-mail da Corretora</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-[#00FF00] transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-4 mb-1 block">Senha da Corretora</label>
              <input 
                type="password" 
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-[#00FF00] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
            <ShieldCheck className="w-5 h-5 text-[#00FF00]" />
            <p className="text-[10px] text-zinc-400 leading-tight">
              Suas credenciais são criptografadas e enviadas diretamente para a API da Bullex. Nós não armazenamos sua senha.
            </p>
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-[#00FF00] text-black font-black rounded-2xl hover:bg-[#00CC00] transition-all disabled:opacity-50 shadow-[0_10px_20px_rgba(0,255,0,0.2)]"
          >
            {loading ? 'AUTENTICANDO...' : 'CONECTAR AGORA'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-3">Ainda não tem conta na Bullex?</p>
            <a 
              href="https://trade.bull-ex.com/register?aff=817955&aff_model=revenue&afftrack=" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block w-full py-4 bg-zinc-800 text-white text-xs font-bold rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              CRIE SUA CONTA AGORA
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
