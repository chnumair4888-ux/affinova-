import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Stat={visitors:number;page_views:number;affiliate_clicks:number;searches:number};
type ProductStat={id:string;title:string;views:number;clicks:number;ctr:number};
type CountryStat={country:string;visitors:number;page_views:number};

export default function AdminAnalytics(){
  const [days,setDays]=useState(30);
  const [data,setData]=useState<Stat|null>(null);
  const [products,setProducts]=useState<ProductStat[]>([]);
  const [countries,setCountries]=useState<CountryStat[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    setError("");
    const end=new Date(),start=new Date(Date.now()-days*86400000);
    const [summary,stats,countryStats]=await Promise.all([
      supabase.rpc("admin_analytics_summary",{p_start:start.toISOString(),p_end:end.toISOString()}),
      supabase.rpc("admin_product_stats_range",{p_start:start.toISOString(),p_end:end.toISOString()}),
      supabase.rpc("admin_country_stats",{p_start:start.toISOString(),p_end:end.toISOString()})
    ]);
    if(summary.error||stats.error||countryStats.error){setError(summary.error?.message||stats.error?.message||countryStats.error?.message||"Could not load analytics.");}else{setError("");}
    setData((summary.data||null) as Stat|null);
    setProducts((stats.data||[]) as ProductStat[]);
    setCountries((countryStats.data||[]) as CountryStat[]);
    setLoading(false);
  },[days]);

  useEffect(()=>{load()},[load]);

  const ctr=useMemo(()=>{
    if(!data?.page_views)return 0;
    return ((data.affiliate_clicks*100)/data.page_views).toFixed(2);
  },[data]);

  const exportCsv=()=>{
    const rows=[["Product","Views","Clicks","CTR"],...products.map(p=>[p.title,String(p.views),String(p.clicks),String(p.ctr)])];
    const csv=rows.map(row=>row.map(v=>"\"" + String(v).replace(/"/g,'""') + "\"").join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="affinova-product-analytics-"+days+"d.csv";a.click();URL.revokeObjectURL(url);
  };

  const refresh=()=>{void load()};

  return <section className="admin-page">
    <div className="admin-toolbar">
      <div><h1>Analytics</h1><p>Real Affinova traffic and affiliate activity.</p></div>
      <div style={{display:"flex",gap:8}}>
        <select value={days} onChange={e=>setDays(Number(e.target.value))}>
          <option value="1">Today</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
        </select>
        <button onClick={refresh} disabled={loading}>{loading?"Loading...":"Refresh"}</button><button onClick={exportCsv} disabled={!products.length}>Export CSV</button>
      </div>
    </div>
    {error&&<div className="notice">{error}</div>}
    <div className="admin-stats">
      {[["Visitors",data?.visitors],["Page views",data?.page_views],["Affiliate clicks",data?.affiliate_clicks],["CTR",String(ctr)+"%"],["Searches",data?.searches]].map(([label,value])=>
        <article className="admin-stat" key={label as string}><span>{label}</span><strong>{loading?"…":value??"No data yet"}</strong></article>
      )}
    </div>

    <div className="analytics-panel">
      <div className="analytics-panel-head">
        <div><h2>Traffic by country</h2><p>Real country estimates from Cloudflare visitor requests. No synthetic or guessed traffic is added.</p></div>
      </div>
      {!countries.length?<div className="admin-empty">No country traffic recorded yet.</div>:
        <div style={{overflowX:"auto"}}><table className="analytics-table"><thead><tr><th>Country</th><th>Visitors</th><th>Page views</th></tr></thead><tbody>
          {countries.map(c=><tr key={c.country}><td>{c.country==="Unknown"?"Unknown":c.country}</td><td>{c.visitors}</td><td>{c.page_views}</td></tr>)}
        </tbody></table></div>
      }
    </div>

    <div className="analytics-panel">
      <h2>Top products</h2>
      {!products.length?<div className="admin-empty">No data yet</div>:<div style={{overflowX:"auto"}}><table className="analytics-table"><thead><tr><th>Product</th><th>Views</th><th>Clicks</th><th>CTR</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.title}</td><td>{p.views}</td><td>{p.clicks}</td><td>{p.ctr}%</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
