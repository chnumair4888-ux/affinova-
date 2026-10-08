import { supabase } from "./supabase";

const KEY="affinova_anon_session";
const botPattern=/bot|crawler|spider|slurp|facebookexternalhit|bingpreview|headless/i;

export function getAnalyticsSessionId(){
  try{
    let id=localStorage.getItem(KEY);
    if(!id){id=crypto.randomUUID();localStorage.setItem(KEY,id);}
    return id;
  }catch{return crypto.randomUUID();}
}

function canTrack(){
  if(typeof window==="undefined") return false;
  if(location.pathname.startsWith("/admin")) return false;
  return !botPattern.test(navigator.userAgent||"") && !navigator.webdriver;
}

function deviceType(){
  const w=window.innerWidth;
  return w<640?"mobile":w<1024?"tablet":"desktop";
}

export async function trackPageView(productId?:string|null){
  if(!canTrack()) return;
  const u=new URL(location.href);
  const payload={
    session_id:getAnalyticsSessionId(),
    path:u.pathname+u.search,
    referrer:document.referrer||null,
    device_type:deviceType(),
    country:null,
    utm_source:u.searchParams.get("utm_source"),
    utm_medium:u.searchParams.get("utm_medium"),
    utm_campaign:u.searchParams.get("utm_campaign"),
    product_id:productId||null
  };
  try{await supabase.from("page_views").insert(payload)}catch{}
}

export function trackClick(eventType:"affiliate"|"cta"|"wishlist"|"compare", productId?:string|null, label?:string, destination?:string){
  if(!canTrack()) return;
  const payload={session_id:getAnalyticsSessionId(),event_type:eventType,path:location.pathname,product_id:productId||null,label:label||null,destination:destination||null,device_type:deviceType(),country:null};
  try{
    const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});
    if(navigator.sendBeacon){
      const url=`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/click_events`;
      const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||"";
      const ok=navigator.sendBeacon(url,new Blob([JSON.stringify(payload)],{type:"application/json"}));
      if(ok)return;
      void key;
    }
  }catch{}
  void supabase.from("click_events").insert(payload);
}

export function trackSearch(query:string, resultsCount:number){
  if(!canTrack()||!query.trim()) return;
  void supabase.from("search_events").insert({session_id:getAnalyticsSessionId(),query:query.trim().slice(0,200),results_count:resultsCount,path:location.pathname,device_type:deviceType()});
}
