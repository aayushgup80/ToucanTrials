// ============================================================
// TOUCANTRIALS - SUPABASE CLIENT
// ============================================================

const SUPABASE_URL =
    "https://chrntgzgihikdbvltpsb.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocm50Z3pnaWhpa2Ridmx0cHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjY1ODcsImV4cCI6MjEwMzI0MjU4N30.qj_m-WeR1Ziy5ipYRn8oKGsokUTjBdn5uWWxmpf05Q0";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


console.log(
    "ToucanTrials Supabase client initialized."
);