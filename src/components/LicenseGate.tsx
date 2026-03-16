import React from 'react';
import { motion } from 'motion/react';
import { Check, Shield, Zap, Crown, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 97,00',
    benefits: ['Acesso total ao robô', 'Suporte via WhatsApp', 'Análise IA Gemini', 'Gestão de banca'],
    icon: Zap
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 'R$ 247,00',
    benefits: ['Acesso total ao robô', 'Suporte prioritário', 'Análise IA Gemini', 'Gestão de banca', 'Economia de 15%'],
    icon: Shield,
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    price: 'R$ 597,00',
    benefits: ['Acesso vitalício', 'Suporte VIP', 'Análise IA Gemini', 'Gestão de banca', 'Atualizações gratuitas'],
    icon: Crown
  }
];

export const LicenseGate: React.FC = () => {
  const { profile } = useAuth();

  const handlePurchase = (planName: string) => {
    const message = `Olá, me chamo ${profile?.displayName} gostaria de adquirir o acesso ${planName} ao robo Profitus`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5569996078041?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="text-white py-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-[#00FF00] mb-4 tracking-tighter">ACESSO RESTRITO</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Você ainda não possui uma licença ativa. Escolha um dos planos abaixo para liberar o acesso ao robô Profitus e começar a lucrar no mercado Bullex.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -10 }}
            className={`relative bg-zinc-900 border ${plan.popular ? 'border-[#00FF00]' : 'border-zinc-800'} rounded-3xl p-8 flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00FF00] text-black text-xs font-bold px-4 py-1 rounded-full">
                MAIS POPULAR
              </div>
            )}
            
            <div className="mb-6">
              <plan.icon className={`w-12 h-12 ${plan.popular ? 'text-[#00FF00]' : 'text-zinc-400'} mb-4`} />
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-[#00FF00]">{plan.price}</div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                  <Check className="w-4 h-4 text-[#00FF00]" />
                  {benefit}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(plan.name)}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                plan.popular ? 'bg-[#00FF00] text-black hover:bg-[#00CC00]' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              LIBERAR ACESSO
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
