import { supabase } from "./supabase";

const KEY="affinova_anon_session";
const COUNTRY_KEY="affinova_visitor_country";
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

async function getVisitorCountry(){
  try{
    const cached=sessionStorage.getItem(COUNTRY_KEY);
    if(cached) return cached==="XX"?null:cached;
    const res=await fetch("/cdn-cgi/trace",{cache:"no-store"});
    if(!res.ok) return null;
    const body=await res.text();
    const match=body.match(/(?:^|\\n)loc=([A-Z]{2})(?:\\n|$)/);
    const country=match?.[1]||null;
    if(country) sessionStorage.setItem(COUNTRY_KEY,country);
    return country;
  }catch{return null}
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
    country:await getVisitorCountry(),
    utm_source:u.searchParams.get("utm_source"),
    utm_medium:u.searchParams.get("utm_medium"),
    utm_campaign:u.searchParams.get("utm_campaign"),
    product_id:productId||null
  };
  try{await supabase.from("page_views").insert(payload)}catch{}
}

export async function trackClick(eventType:"affiliate"|"cta"|"wishlist"|"compare", productId?:string|null, label?:string, destination?:string){
  if(!canTrack()) return;
  const payload={session_id:getAnalyticsSessionId(),event_type:eventType,path:location.pathname,product_id:productId||null,label:label||null,destination:destination||null,device_type:deviceType(),country:await getVisitorCountry()};
  try{
    const url=`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/click_events`;
    const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||"";
    void fetch(url,{method:"POST",headers:{"content-type":"application/json","apikey":key,"Authorization":`Bearer ${key}`,"Prefer":"return=minimal"},body:JSON.stringify(payload),keepalive:true});
    return;
  }catch{}
  void supabase.from("click_events").insert(payload);
}

export async function trackSearch(query:string, resultsCount:number){
  if(!canTrack()||!query.trim()) return;
  await getVisitorCountry();
  void supabase.from("search_events").insert({session_id:getAnalyticsSessionId(),query:query.trim().slice(0,200),results_count:resultsCount,path:location.pathname,device_type:deviceType()});
}
