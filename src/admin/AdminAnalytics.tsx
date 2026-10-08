import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Stat={visitors:number;page_views:number;affiliate_clicks:number;searches:number};
type ProductStat={id:string;title:string;views:number;clicks:number;ctr:number};

export default function AdminAnalytics(){
  const [days,setDays]=useState(30);
  const [data,setData]=useState<Stat|null>(null);
  const [products,setProducts]=useState<ProductStat[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      setLoading(true);
      const end=new Date(),start=new Date(Date.now()-days*86400000);
      const [summary,stats]=await Promise.all([
        supabase.rpc("admin_analytics_summary",{p_start:start.toISOString(),p_end:end.toISOString()}),
        supabase.from("admin_product_stats").select("id,title,views,clicks,ctr").order("clicks",{ascending:false}).limit(50)
      ]);
      if(alive){
        setData((summary.data||null) as Stat|null);
        setProducts((stats.data||[]) as ProductStat[]);
        setLoading(false);
      }
    })();
    return()=>{alive=false};
  },[days]);

  const ctr=useMemo(()=>{
    if(!data?.page_views)return 0;
    return ((data.affiliate_clicks*100)/data.page_views).toFixed(2);
  },[data]);

  const exportCsv=()=>{
    const rows=[["Product","Views","Clicks","CTR"],...products.map(p=>[p.title,String(p.views),String(p.clicks),String(p.ctr)])];
    const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`affinova-product-analytics-${days}d.csv`;a.click();URL.revokeObjectURL(url);
  };

  return <section className="admin-page">
    <div className="admin-toolbar">
      <div><h1>Analytics</h1><p>Real Affinova traffic and affiliate activity.</p></div>
      <div style={{display:"flex",gap:8}}>
        <select value={days} onChange={e=>setDays(Number(e.target.value))}>
          <option value="1">Today</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
        </select>
        <button onClick={exportCsv} disabled={!products.length}>Export CSV</button>
      </div>
    </div>
    <div className="admin-stats">
      {[["Visitors",data?.visitors],["Page views",data?.page_views],["Affiliate clicks",data?.affiliate_clicks],["CTR",`${ctr}%`],["Searches",data?.searches]].map(([label,value])=>
        <article className="admin-stat" key={label as string}><span>{label}</span><strong>{loading?"…":value??"No data yet"}</strong></article>
      )}
    </div>
    <div style={{marginTop:18,background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>Top products</h2>
      {!products.length?<div className="admin-empty">No data yet</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:10}}>Product</th><th style={{textAlign:"right",padding:10}}>Views</th><th style={{textAlign:"right",padding:10}}>Clicks</th><th style={{textAlign:"right",padding:10}}>CTR</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td style={{padding:10,borderTop:"1px solid #eee"}}>{p.title}</td><td style={{padding:10,borderTop:"1px solid #eee",textAlign:"right"}}>{p.views}</td><td style={{padding:10,borderTop:"1px solid #eee",textAlign:"right"}}>{p.clicks}</td><td style={{padding:10,borderTop:"1px solid #eee",textAlign:"right"}}>{p.ctr}%</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
