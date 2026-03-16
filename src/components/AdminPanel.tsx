import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Users, Shield, Trash2, Ban, CheckCircle, Search } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLicense = async (uid: string, type: string) => {
    try {
      await fetch(`/api/profile/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseType: type })
      });
      fetchUsers();
    } catch (err) {
      console.error("Update license error:", err);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    try {
      await fetch(`/api/profile/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 'active' ? 'blocked' : 'active' })
      });
      fetchUsers();
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await fetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
        fetchUsers();
      } catch (err) {
        console.error("Delete user error:", err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00FF00] flex items-center gap-3">
              <Shield className="w-8 h-8" />
              PAINEL ADMINISTRATIVO
            </h1>
            <p className="text-zinc-500">Gerenciamento de usuários e licenças</p>
          </div>
        </header>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou usuário..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#00FF00]"
              />
            </div>
            <div className="flex gap-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Total: {users.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">Licença</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{user.displayName}</span>
                        <span className="text-xs text-zinc-500">@{user.username}</span>
                        <span className="text-[10px] text-zinc-600">{user.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.licenseType}
                        onChange={(e) => handleUpdateLicense(user.uid, e.target.value)}
                        className="bg-black border border-zinc-800 text-xs rounded-lg px-2 py-1 outline-none focus:border-[#00FF00]"
                      >
                        <option value="none">Nenhuma</option>
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="lifetime">Vitalício</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-red-500/10 text-red-500'}`}>
                        {user.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleToggleStatus(user.uid, user.status)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
                        title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
