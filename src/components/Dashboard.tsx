import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Activity, Target, 
  ShieldAlert, Power, RefreshCw, History, Settings,
  LogOut, User, DollarSign, Percent, CreditCard,
  LayoutDashboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { LicenseGate } from './LicenseGate';
import { ResultModal } from './ResultModal';
import { BrokerModal } from './BrokerModal';
import { analyzeMarket } from '../services/geminiService';
import { Trade, MarketAnalysis } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Dashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const [view, setView] = useState<'main' | 'plans'>('main');
  const [isBotActive, setIsBotActive] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [asset, setAsset] = useState('EUR/USD');
  const [availableAssets, setAvailableAssets] = useState<string[]>(['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD']);
  const [timeframe, setTimeframe] = useState('M1');
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal || 0);
  const [dailyStopLoss, setDailyStopLoss] = useState(profile?.dailyStopLoss || 0);
  const [minTradeAmount, setMinTradeAmount] = useState(profile?.minTradeAmount || 5);
  const [maxTradeAmount, setMaxTradeAmount] = useState(profile?.maxTradeAmount || 10);

  // Bullex Broker State
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPass, setBrokerPass] = useState('');
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [connectingBroker, setConnectingBroker] = useState(false);
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [demoBalance, setDemoBalance] = useState(10000); // Default demo balance
  const [realBalance, setRealBalance] = useState(0);

  // Result Modals
  const [showResult, setShowResult] = useState<'goal' | 'stop' | null>(null);

  useEffect(() => {
    if (profile) {
      fetchTrades();
    }
  }, [profile]);

  const fetchTrades = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/trades/${profile.uid}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (err) {
      console.error("Fetch trades error:", err);
    }
  };

  const fetchBrokerData = async (email: string, type: string) => {
    try {
      const balanceRes = await fetch(`/api/bullex/balance?email=${email}&type=${type}`);
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        if (type === 'real') setRealBalance(balanceData.balance);
        else setDemoBalance(balanceData.balance);
      }

      const assetsRes = await fetch(`/api/bullex/assets?email=${email}`);
      const assetsData = await assetsRes.json();
      if (assetsData.success && assetsData.assets.length > 0) {
        setAvailableAssets(assetsData.assets);
        setAsset(assetsData.assets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectBroker = async (email: string, pass: string, type: 'demo' | 'real') => {
    setConnectingBroker(true);
    try {
      const res = await fetch('/api/bullex/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      
      if (data.success) {
        setBrokerEmail(email);
        setBrokerPass(pass);
        setAccountType(type);
        setIsBrokerConnected(true);
        await fetchBrokerData(email, type);
      } else {
        alert("Erro ao conectar à Bullex: " + data.message);
      }
    } catch (err: any) {
      alert("Erro local: " + err.message);
    } finally {
      setConnectingBroker(false);
    }
  };

  const handleAccountTypeChange = async (newType: 'demo' | 'real') => {
    setAccountType(newType);
    if (isBrokerConnected && brokerEmail) {
      try {
        const balanceRes = await fetch(`/api/bullex/balance?email=${brokerEmail}&type=${newType}`);
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          if (newType === 'real') setRealBalance(balanceData.balance);
          else setDemoBalance(balanceData.balance);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleBot = async () => {
    if (!isBrokerConnected) {
      alert("Por favor, conecte sua conta Bullex primeiro.");
      return;
    }
    setIsBotActive(!isBotActive);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const runCycle = async () => {
      if (!isBotActive) return;
      
      // Check for goal/stop before analyzing
      const currentProfit = trades.reduce((acc, t) => acc + t.profit, 0);
      if (currentProfit >= dailyGoal && dailyGoal > 0) {
        setIsBotActive(false);
        setShowResult('goal');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FF00', '#ffffff', '#008000']
        });
        return;
      }
      if (currentProfit <= -dailyStopLoss && dailyStopLoss > 0) {
        setIsBotActive(false);
        setShowResult('stop');
        return;
      }

      setLoadingAnalysis(true);
      try {
        const result = await analyzeMarket(asset, timeframe);
        setAnalysis(result);
        setLoadingAnalysis(false);

        if (result.confidence >= 70 && (result.signal === 'BUY' || result.signal === 'SELL')) {
          console.log(`Sinal forte detectado (${result.signal} - ${result.confidence}%). Executando entrada...`);
          await executeTrade(result.signal);
        } else {
          console.log("Sinal fraco ou neutro. Aguardando próxima oportunidade.");
        }
      } catch (err) {
        console.error("Bot cycle error:", err);
        setLoadingAnalysis(false);
      }

      if (isBotActive) {
        timeoutId = setTimeout(runCycle, 15000);
      }
    };

    if (isBotActive) {
      runCycle();
    }

    return () => clearTimeout(timeoutId);
  }, [isBotActive, asset, dailyGoal, dailyStopLoss, trades]);

  const executeTrade = async (type: 'BUY' | 'SELL') => {
    if (!profile) return;

    const amount = Math.floor(Math.random() * (maxTradeAmount - minTradeAmount + 1)) + minTradeAmount;
    let isWin = Math.random() > 0.4;
    let profit = isWin ? amount * 0.85 : -amount;

    if (isBrokerConnected && brokerEmail) {
      try {
        const action = type.toLowerCase() === 'buy' ? 'call' : 'put';
        const durationMin = timeframe === 'H1' ? 60 : parseInt(timeframe.replace('M', '')) || 1;
        const res = await fetch('/api/bullex/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: brokerEmail,
            asset: asset,
            action: action,
            amount: amount,
            duration: durationMin
          })
        });
        const data = await res.json();
        if (!data.success) {
           console.error("Falha ao abrir ordem na Bullex: ", data.message);
        } else {
           console.log("Ordem aberta na Bullex! ID:", data.order_id);
        }
      } catch (err) {
        console.error("Erro na API da Bullex:", err);
      }
    }

    const newTrade: Trade = {
      uid: profile.uid,
      timestamp: new Date().toISOString(),
      asset,
      type: type.toLowerCase() as 'buy' | 'sell',
      result: isWin ? 'win' : 'loss',
      amount,
      profit
    };

    try {
      // Always save trade to history, regardless of account type
      await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTrade,
          accountType // Add account type to trade record
        })
      });

      if (accountType === 'real') {
        await fetch(`/api/profile/${profile.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: profile.balance + profit })
        });
        setRealBalance(prev => prev + profit);
      } else {
        setDemoBalance(prev => prev + profit);
      }

      fetchTrades();
    } catch (err) {
      console.error("Execute trade error:", err);
    }
  };

  const updateProfileSettings = async (field: string, value: number) => {
    if (!profile) return;
    try {
      await fetch(`/api/profile/${profile.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (err) {
      console.error("Update settings error:", err);
    }
  };

  const wins = trades.filter(t => t.result === 'win').length;
  const losses = trades.filter(t => t.result === 'loss').length;
  const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);
  const yieldPercent = profile?.initialCapital ? (totalProfit / profile.initialCapital) * 100 : 0;

  const daysRemaining = profile?.licenseExpiry 
    ? Math.max(0, Math.ceil((new Date(profile.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const chartData = [...trades].reverse().map((t, i) => ({
    name: i,
    profit: t.profit,
    balance: profile?.balance ? profile.balance - totalProfit + trades.slice(i).reduce((acc, curr) => acc + curr.profit, 0) : 0
  }));

  if (view === 'plans') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-4 md:p-8">
          <button 
            onClick={() => setView('main')}
            className="mb-8 flex items-center gap-2 text-[#00FF00] hover:underline"
          >
            ← Voltar ao Dashboard
          </button>
          <LicenseGate />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AnimatePresence>
        {showResult && (
          <ResultModal type={showResult} onClose={() => setShowResult(null)} />
        )}
        {!isBrokerConnected && (
          <BrokerModal onConnect={handleConnectBroker} />
        )}
      </AnimatePresence>

      {/* Vertical Sidebar */}
      <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 hidden lg:flex">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-[#00FF00] tracking-tighter">PROFITUS</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Inteligência Artificial</p>
        </div>

        <div className="flex-1 space-y-8">
          <nav className="space-y-2">
            <button 
              onClick={() => setView('main')}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all ${view === 'main' ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setView('plans')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Planos
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </nav>
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-bold">{profile?.displayName}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{profile?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00FF00] tracking-tighter">CENTRAL DE OPERAÇÕES</h1>
            <p className="text-zinc-500 text-sm">Monitoramento em tempo real dos ativos Bullex</p>
          </div>
        </header>

      {profile?.licenseType === 'none' && profile?.role !== 'admin' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-bold text-red-500 text-sm">ACESSO LIMITADO</p>
              <p className="text-zinc-400 text-xs">Você está usando uma conta sem licença ativa. Algumas funções podem estar restritas.</p>
            </div>
          </div>
          <button 
            onClick={() => setView('plans')}
            className="px-6 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors"
          >
            LIBERAR AGORA
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard 
              title={`Saldo ${accountType === 'demo' ? 'Demo' : 'Real'}`} 
              value={`R$ ${(accountType === 'demo' ? demoBalance : realBalance).toFixed(2)}`} 
              icon={DollarSign} 
              color="text-[#00FF00]" 
            />
            <StatCard title="Rendimento" value={`${yieldPercent.toFixed(2)}%`} icon={Percent} color="text-purple-400" />
            <StatCard title="Meta Diária" value={`R$ ${profile?.dailyGoal.toFixed(2)}`} icon={Target} color="text-blue-400" />
            <StatCard title="Vencimento" value={`${daysRemaining} Dias`} icon={History} color="text-orange-400" />
            <StatCard title="Stop Loss" value={`R$ ${profile?.dailyStopLoss.toFixed(2)}`} icon={ShieldAlert} color="text-red-400" />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isBotActive ? 'border-[#00FF00] shadow-[0_0_20px_rgba(0,255,0,0.3)]' : 'border-zinc-800'}`}>
              <Power className={`w-12 h-12 ${isBotActive ? 'text-[#00FF00]' : 'text-zinc-700'}`} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">{isBotActive ? 'ROBÔ ATIVADO' : 'ROBÔ DESATIVADO'}</h3>
              <p className="text-zinc-500 text-xs">Status operacional em tempo real</p>
            </div>
            <button 
              onClick={handleToggleBot}
            className={`w-full py-4 rounded-2xl font-bold transition-all ${isBotActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#00FF00] text-black hover:bg-[#00CC00]'}`}
          >
            {isBotActive ? 'DESATIVAR AGORA' : 'ATIVAR ROBÔ'}
          </button>
        </div>

          <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00FF00]" />
                DESEMPENHO DO ROBÔ
              </h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-[#00FF00]"><div className="w-2 h-2 rounded-full bg-[#00FF00]" /> WIN: {wins}</span>
                <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500" /> LOSS: {losses}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  itemStyle={{ color: '#00FF00' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#00FF00" fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 text-[#00FF00] ${loadingAnalysis ? 'animate-spin' : ''}`} />
                ANÁLISE IA GEMINI (BULLEX)
              </h3>
              {analysis ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <span className="text-xs text-zinc-500 block">Sinal</span>
                      <span className={`font-bold text-lg ${analysis.signal === 'BUY' ? 'text-[#00FF00]' : analysis.signal === 'SELL' ? 'text-red-500' : 'text-zinc-400'}`}>
                        {analysis.signal}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 block">Confiança</span>
                      <span className="font-bold text-lg text-[#00FF00]">{analysis.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 italic">"{analysis.reasoning}"</p>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">
                  Ative o robô para iniciar a análise em tempo real
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#00FF00]" />
                ÚLTIMAS OPERAÇÕES
              </h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {trades.map((trade, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.result === 'win' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-red-500/10 text-red-500'}`}>
                        {trade.result === 'win' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black tracking-tight">{trade.asset}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${trade.result === 'win' ? 'bg-[#00FF00] text-black' : 'bg-red-500 text-white'}`}>
                            {trade.result === 'win' ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                          <span>{trade.type}</span>
                          <span>•</span>
                          <span>{new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black ${trade.result === 'win' ? 'text-[#00FF00]' : 'text-red-500'}`}>
                        {trade.result === 'win' ? '+' : ''}R$ {Math.abs(trade.profit).toFixed(2)}
                      </span>
                      <span className="text-[8px] text-zinc-600 block font-bold uppercase tracking-widest">{trade.accountType === 'demo' ? 'CONTA DEMO' : 'CONTA REAL'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00FF00]" />
              CONFIGURAÇÕES
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Modalidade de Conta</label>
                <select 
                  value={accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value as 'demo' | 'real')}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                >
                  <option value="demo">CONTA DEMO</option>
                  <option value="real">CONTA REAL</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Ativo de Operação</label>
                <select 
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                >
                  {availableAssets.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Time Gráfico (Timeframe)</label>
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                >
                  <option value="M1">1 MINUTO (M1)</option>
                  <option value="M5">5 MINUTOS (M5)</option>
                  <option value="M15">15 MINUTOS (M15)</option>
                  <option value="M30">30 MINUTOS (M30)</option>
                  <option value="H1">1 HORA (H1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Meta Diária (R$)</label>
                <input 
                  type="number" 
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  onBlur={() => updateProfileSettings('dailyGoal', dailyGoal)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Stop Loss (R$)</label>
                <input 
                  type="number" 
                  value={dailyStopLoss}
                  onChange={(e) => setDailyStopLoss(Number(e.target.value))}
                  onBlur={() => updateProfileSettings('dailyStopLoss', dailyStopLoss)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Inv. Mínimo (R$)</label>
                  <input 
                    type="number" 
                    value={minTradeAmount}
                    onChange={(e) => setMinTradeAmount(Number(e.target.value))}
                    onBlur={() => updateProfileSettings('minTradeAmount', minTradeAmount)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Inv. Máximo (R$)</label>
                  <input 
                    type="number" 
                    value={maxTradeAmount}
                    onChange={(e) => setMaxTradeAmount(Number(e.target.value))}
                    onBlur={() => updateProfileSettings('maxTradeAmount', maxTradeAmount)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:border-[#00FF00]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#00FF00]" />
              PLANOS DE ACESSO
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Veja nossos planos disponíveis e libere o acesso total ao robô.
            </p>
            <button 
              onClick={() => setView('plans')}
              className="w-full py-3 bg-[#00FF00] text-black rounded-xl text-xs font-bold hover:bg-[#00CC00] transition-colors"
            >
              VER PLANOS DISPONÍVEIS
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 bg-black rounded-xl border border-zinc-800 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h4 className="text-zinc-500 text-xs font-medium mb-1">{title}</h4>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);
