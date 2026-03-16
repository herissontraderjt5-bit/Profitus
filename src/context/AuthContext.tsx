import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: { uid: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUid = localStorage.getItem('profitus_uid');
    if (savedUid) {
      fetchProfile(savedUid);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const res = await fetch(`/api/profile/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setUser({ uid: data.uid });
      } else {
        logout();
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao entrar');
    }

    const data = await res.json();
    setProfile(data);
    setUser({ uid: data.uid });
    localStorage.setItem('profitus_uid', data.uid);
  };

  const register = async (regData: any) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData)
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao cadastrar');
    }

    const data = await res.json();
    setProfile(data);
    setUser({ uid: data.uid });
    localStorage.setItem('profitus_uid', data.uid);
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('profitus_uid');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
