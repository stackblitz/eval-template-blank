import { createClient } from '@supabase/supabase-js';
import type { Board, List, Task } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseKey ? '[REDACTED]' : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" in the top right.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      boards: {
        Row: Board;
        Insert: Omit<Board, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>;
      };
      lists: {
        Row: List;
        Insert: Omit<List, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<List, 'id' | 'created_at' | 'updated_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};