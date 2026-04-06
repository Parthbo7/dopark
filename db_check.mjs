import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

fetch(`${SUPABASE_URL}/rest/v1/parking_slots?select=*&limit=1`, {
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  }
}).then(res => res.json()).then(data => {
  console.log("parking_slots schema:", data);
}).catch(console.error);
