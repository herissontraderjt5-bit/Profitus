export type LicenseType = 'none' | 'monthly' | 'quarterly' | 'lifetime';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  phone: string;
  role: UserRole;
  licenseType: LicenseType;
  licenseExpiry?: string;
  balance: number;
  initialCapital: number;
  dailyGoal: number;
  dailyStopLoss: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  status: 'active' | 'blocked';
  lastLogin?: string;
}

export interface Trade {
  id?: string;
  uid: string;
  timestamp: string;
  asset: string;
  type: 'buy' | 'sell';
  result: 'win' | 'loss';
  amount: number;
  profit: number;
}

export interface MarketAnalysis {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
  confluences: string[];
}
