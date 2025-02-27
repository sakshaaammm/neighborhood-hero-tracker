
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lahdbqxezipteortsqny.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaGRicXhlemlwdGVvcnRzcW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NzYxNzIsImV4cCI6MjA1NjI1MjE3Mn0.Q__UxZXz-8e7doP-uoupiVKlY73lMKHihowAzgVC0lY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
