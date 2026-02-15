import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://akkmgnqkrttygnuhuelv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFra21nbnFrcnR0eWdudWh1ZWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTU1MTQsImV4cCI6MjA4NjYzMTUxNH0.z0S872w2-jt5TNLjYbpzBYl1WtRjXhUwLnB5DDQyTMM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);