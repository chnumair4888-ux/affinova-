import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
import {Save,RefreshCw} from "lucide-react";

const fields=[
 {key:"general",title:"General",items:[["site_name","Site name"],["tagline","Tagline"],["contact_email","Contact email"]]},
 {key:"seo",title:"SEO",items:[["meta_title","Meta title"],["meta_description","Meta description"],["og_image","OG image URL"]]},
 {key:"social",title:"Social",items:[["facebook","Facebook URL"],["instagram","Instagram URL"],["youtube","YouTube URL"],["x","X / Twitter URL"]]},
 {key:"footer",title:"Footer",items:[["text","Footer text"]]},
 {key:"affiliate",title:"Affiliate disclosure",items:[["disclosure","Disclosure text"]]},
 {key:"appearance",title:"Appearance",items:[["theme","Theme (system/light/dark)"],["primary_color","Primary color"]]},
 {key:"integrations",title:"Integrations",items:[["analytics_id","Analytics ID"],["adsense_home_slot","AdSense home slot"]]}
] as const;

export default function AdminSettings(){
 const [values,setValues]=useState<Record<string,Record<string,any>>>({});
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[msg,setMsg]=useState("");
 const load=async()=>{setLoading(true);setMsg("");const {data,error}=await supabase.from("site_settings").select("key,value").order("key");if(error)setMsg(error.message);const next:Record<string,Record<string,any>>={};(data||[]).forEach(r=>{next[r.key]=r.value&&typeof r.value==="object"?r.value:{}});setValues(next);setLoading(false)};
 useEffect(()=>{load()},[]);
 const setValue=(section:string,key:string,value:string)=>setValues(v=>({...v,[section]:{...(v[section]||{}),[key]:value}}));
 const save=async()=>{setSaving(true);setMsg("");for(const section of fields){const value=values[section.key]||{};const {error}=await supabase.from("site_settings").upsert({key:section.key,value,updated_at:new Date().toISOString()});if(error){setMsg(error.message);setSaving(false);return}}setMsg("Settings saved successfully.");setSaving(false)};
 return <section className="admin-page" style={{display:"block",minHeight:"auto"}}>
  <div className="admin-toolbar"><div><span className="eyebrow">Site configuration</span><h1>Settings</h1><p>Control Affinova's public site values from Supabase.</p></div><div style={{display:"flex",gap:8}}><button className="btn" onClick={load} disabled={loading}><RefreshCw size={14}/> Reload</button><button className="btn primary" onClick={save} disabled={saving||loading}><Save size={14}/> {saving?"Saving...":"Save settings"}</button></div></div>
  {msg&&<div className="notice">{msg}</div>}
  {loading?<div className="notice">Loading settings...</div>:<div className="admin-settings-grid">{fields.map(section=><article key={section.key} style={{background:"#fff",border:"1px solid #ddd9d0",padding:18}}><h2 style={{margin:"0 0 12px",fontSize:20}}>{section.title}</h2>{section.items.map(([key,label])=><label key={key} style={{display:"grid",gap:7,marginBottom:12,fontSize:11,fontWeight:700}}>{label}<input value={String(values[section.key]?.[key]??"")} onChange={e=>setValue(section.key,key,e.target.value)} placeholder={label}/></label>)}</article>)}</div>}
 </section>;
}
