const SUPABASE_URL='https://fwbwmcezqyxyzcenjlog.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_czEDfQDeSOqYqefD-uCk9Q_Vq2_2ide';

window.supabaseClient=window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}
);

// Auth emails should return to the page the user is currently using.
// Supabase must have the localhost and production URLs allow-listed.
window.getAuthRedirectUrl=function(path='client.html'){
  const base=window.location.origin;
  return base+(path.startsWith('/')?path:'/'+path);
};

// Supabase places email-confirmation tokens in the URL hash.
// Give the client time to consume the hash, then remove sensitive tokens
// from the visible URL without logging them or leaving them in browser history.
window.supabaseClient.auth.onAuthStateChange((event, session)=>{
  if(event==='SIGNED_IN' && session){
    const hash=window.location.hash;
    if(hash.includes('access_token=') || hash.includes('type=signup') || hash.includes('type=recovery')){
      window.history.replaceState({},document.title,window.location.pathname+window.location.search);
    }
  }
});