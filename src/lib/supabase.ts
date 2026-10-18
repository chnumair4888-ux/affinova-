import {createClient} from "@supabase/supabase-js";

// Keep the public project URL as a production fallback so the storefront
// still boots if the Vite URL variable is not present during CI builds.
const url=import.meta.env.VITE_SUPABASE_URL||"https://vrebunefcbcqfmllxsdm.supabase.co";
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||"";

// Authenticated client used by the admin area.
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

// Public storefront reads must never inherit a stale/expired admin access token.
// Keeping this client sessionless makes public RLS requests consistently use the anon key.
export const publicSupabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{"X-Client-Info":"affinova-public"}}});
