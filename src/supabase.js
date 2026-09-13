import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vkpqylpesjknfrujwmag.supabase.co/rest/v1/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcHF5bHBlc2prbmZydWp3bWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTE5MDEsImV4cCI6MjEwNDg2NzkwMX0.w5P8RCar-VfQTA3ZNF5fKjsqLk07aTQXBP0V1Q7Byak'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)