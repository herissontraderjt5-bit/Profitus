import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/ping', (req, res) => {
  res.json({ pong: true, time: new Date().toISOString(), env: !!process.env.VITE_SUPABASE_URL });
});

app.post('/api/register', async (req, res) => {
  const { username, password, displayName, phone } = req.body;
  
  const { data: existingUser } = await supabase
    .from('users')
    .select('uid')
    .eq('username', username)
    .single();

  if (existingUser) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{
      username,
      password, // In a real app, hash this!
      display_name: displayName,
      phone,
      role: 'user',
      license_type: 'none',
      license_expiry: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  
  const { password: _, display_name, license_type, license_expiry, initial_capital, daily_goal, daily_stop_loss, min_trade_amount, max_trade_amount, last_login, created_at, ...userWithoutPassword } = data as any;
  
  res.json({
    ...userWithoutPassword,
    displayName: display_name,
    licenseType: license_type,
    licenseExpiry: license_expiry,
    initialCapital: initial_capital,
    dailyGoal: daily_goal,
    dailyStopLoss: daily_stop_loss,
    minTradeAmount: min_trade_amount,
    maxTradeAmount: max_trade_amount,
    lastLogin: last_login
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (!user || error) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('uid', user.uid);

  const { password: _, display_name, license_type, license_expiry, initial_capital, daily_goal, daily_stop_loss, min_trade_amount, max_trade_amount, last_login, created_at, ...userWithoutPassword } = user as any;
  
  res.json({
    ...userWithoutPassword,
    displayName: display_name,
    licenseType: license_type,
    licenseExpiry: license_expiry,
    initialCapital: initial_capital,
    dailyGoal: daily_goal,
    dailyStopLoss: daily_stop_loss,
    minTradeAmount: min_trade_amount,
    maxTradeAmount: max_trade_amount,
    lastLogin: new Date().toISOString()
  });
});

app.get('/api/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (!user || error) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { password: _, display_name, license_type, license_expiry, initial_capital, daily_goal, daily_stop_loss, min_trade_amount, max_trade_amount, last_login, created_at, ...userWithoutPassword } = user as any;
  
  res.json({
    ...userWithoutPassword,
    displayName: display_name,
    licenseType: license_type,
    licenseExpiry: license_expiry,
    initialCapital: initial_capital,
    dailyGoal: daily_goal,
    dailyStopLoss: daily_stop_loss,
    minTradeAmount: min_trade_amount,
    maxTradeAmount: max_trade_amount,
    lastLogin: last_login
  });
});

app.patch('/api/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  const updates = req.body;
  
  const dbUpdates: any = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.licenseType !== undefined) dbUpdates.license_type = updates.licenseType;
  if (updates.licenseExpiry !== undefined) dbUpdates.license_expiry = updates.licenseExpiry;
  if (updates.initialCapital !== undefined) dbUpdates.initial_capital = updates.initialCapital;
  if (updates.dailyGoal !== undefined) dbUpdates.daily_goal = updates.dailyGoal;
  if (updates.dailyStopLoss !== undefined) dbUpdates.daily_stop_loss = updates.dailyStopLoss;
  if (updates.minTradeAmount !== undefined) dbUpdates.min_trade_amount = updates.minTradeAmount;
  if (updates.maxTradeAmount !== undefined) dbUpdates.max_trade_amount = updates.maxTradeAmount;
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

  const { data: user, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('uid', uid)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const { password: _, display_name, license_type, license_expiry, initial_capital, daily_goal, daily_stop_loss, min_trade_amount, max_trade_amount, last_login, created_at, ...userWithoutPassword } = user as any;
  
  res.json({
    ...userWithoutPassword,
    displayName: display_name,
    licenseType: license_type,
    licenseExpiry: license_expiry,
    initialCapital: initial_capital,
    dailyGoal: daily_goal,
    dailyStopLoss: daily_stop_loss,
    minTradeAmount: min_trade_amount,
    maxTradeAmount: max_trade_amount,
    lastLogin: last_login
  });
});

app.get('/api/trades/:uid', async (req, res) => {
  const { uid } = req.params;
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('uid', uid)
    .order('timestamp', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  
  res.json(trades.map((t: any) => ({
    ...t,
    accountType: t.account_type
  })));
});

app.post('/api/trades', async (req, res) => {
  const trade = req.body;
  
  const dbTrade = {
    uid: trade.uid,
    asset: trade.asset,
    type: trade.type,
    result: trade.result,
    amount: trade.amount,
    profit: trade.profit,
    account_type: trade.accountType || 'demo'
  };

  const { data, error } = await supabase
    .from('trades')
    .insert([dbTrade])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, accountType: (data as any).account_type });
});

app.get('/api/admin/users', async (req, res) => {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  
  res.json(users.map((u: any) => {
    const { password: _, display_name, license_type, license_expiry, initial_capital, daily_goal, daily_stop_loss, min_trade_amount, max_trade_amount, last_login, created_at, ...userWithoutPassword } = u;
    return {
      ...userWithoutPassword,
      displayName: display_name,
      licenseType: license_type,
      licenseExpiry: license_expiry,
      initialCapital: initial_capital,
      dailyGoal: daily_goal,
      dailyStopLoss: daily_stop_loss,
      minTradeAmount: min_trade_amount,
      maxTradeAmount: max_trade_amount,
      lastLogin: last_login
    };
  }));
});

app.delete('/api/admin/users/:uid', async (req, res) => {
  const { uid } = req.params;
  const { error } = await supabase.from('users').delete().eq('uid', uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/bullex/connect', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/bullex/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bullex/balance', async (req, res) => {
  try {
    const email = req.query.email as string;
    const type = (req.query.type as string) || '';
    const response = await fetch(`http://127.0.0.1:5000/api/bullex/balance?email=${email}&type=${type}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bullex/assets', async (req, res) => {
  try {
    const email = req.query.email as string;
    const response = await fetch(`http://127.0.0.1:5000/api/bullex/assets?email=${email}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bullex/trade', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/bullex/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
