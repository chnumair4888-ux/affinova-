import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminAnalytics(){
  const [days,setDays]=useState(30);
  const [data,setData]=useState<any>(null);
  useEffect(()=>{
    const end=new Date();
    const start=new Date(Date.now()-days*86400000);
    supabase.rpc("admin_analytics_summary",{p_start:start.toISOString(),p_end:end.toISOString()})
      .then(({data,error})=>{ if(error) console.error(error); setData(data||null); });
  },[days]);
  return <section className="admin-page">
    <div className="admin-toolbar">
      <div><h1>Analytics</h1><p>Real Affinova traffic and affiliate activity.</p></div>
      <select value={days} onChange={e=>setDays(Number(e.target.value))}>
        <option value="1">Today</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
      </select>
    </div>
    <div className="admin-stats">
      {[
        ["Visitors",data?.visitors],["Page views",data?.page_views],
        ["Affiliate clicks",data?.affiliate_clicks],["Searches",data?.searches]
      ].map(([label,value])=><article className="admin-stat" key={label as string}>
        <span>{label}</span><strong>{value ?? "No data yet"}</strong>
      </article>)}
    </div>
  </section>;
}
