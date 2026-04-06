import 'dotenv/config.js';
import process from 'process';

async function fetchSchema() {
  const url = process.env.VITE_SUPABASE_URL || 'https://vwzuetdmlilbsdrkpkfn.supabase.co';
  const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  // wait, I can just use the key from .env.local string directly.
}
