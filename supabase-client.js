const SUPABASE_URL='https://fwbwmcezqyxyzcenjlog.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_czEDfQDeSOqYqefD-uCk9Q_Vq2_2ide';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});