import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tddvzukomkujcykmeaar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZHZ6dWtvbWt1amN5a21lYWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQzMDAsImV4cCI6MjA3MjYzMDMwMH0._0QSHzVkdh4xI6GvmdrMLt5jD-sMqYtBlag2GUalm94';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
