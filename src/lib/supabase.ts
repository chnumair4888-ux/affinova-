import {createClient} from "@supabase/supabase-js";

// Public Supabase project values are safe to ship in the browser. Keep fallbacks
// so production builds still boot if GitHub Actions Vite variables are absent.
const url=import.meta.env.VITE_SUPABASE_URL||"https://vrebunefcbcqfmllxsdm.supabase.co";
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||"sb_publishable_r9Uo2bLfiGAn4MoVSD8BbA_UYQYcVtA";

// Authenticated client used by the admin area.
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

// Public storefront reads must never inherit a stale/expired admin access token.
// Keeping this client sessionless makes public RLS requests consistently use the publishable key.
export const publicSupabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{"X-Client-Info":"affinova-public"}}});
