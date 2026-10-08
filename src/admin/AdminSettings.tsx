import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminSettings(){
  const [rows,setRows]=useState<any[]>([]);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{ supabase.from("site_settings").select("*").order("key").then(({data,error})=>{if(error) console.error(error);setRows(data||[]);}); },[]);
  const setValue=(i:number,value:any)=>setRows(r=>r.map((x,n)=>n===i?{...x,value}:x));
  const save=async()=>{
    setSaving(true);
    for(const row of rows) await supabase.from("site_settings").upsert({key:row.key,value:row.value,updated_at:new Date().toISOString()});
    setSaving(false);
  };
  return <section className="admin-page">
    <div className="admin-toolbar"><div><h1>Settings</h1><p>Site settings stored in Supabase.</p></div><button onClick={save} disabled={saving}>{saving?"Saving…":"Save settings"}</button></div>
    {!rows.length?<div className="admin-empty">No data yet</div>:<div className="admin-settings-grid">{rows.map((r,i)=><label key={r.key}><span>{r.key}</span><textarea value={typeof r.value==="string"?r.value:JSON.stringify(r.value,null,2)} onChange={e=>{let v:any=e.target.value;try{v=JSON.parse(v)}catch{}setValue(i,v)}} /></label>)}</div>}
  </section>;
}
