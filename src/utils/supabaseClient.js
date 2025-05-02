import { createClient } from '@supabase/supabase-js'

export const supabaseClient = createClient(
  'https://ifiiddpbsrvulixjlpab.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaWlkZHBic3J2dWxpeGpscGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMDU1ODEsImV4cCI6MjA1MTc4MTU4MX0.WSesjcQcOFBjkiE-DLEZ04SMQFThj3MYFPJ6F0h5AfU'
) 