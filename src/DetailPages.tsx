import {useEffect,useState} from "react";
import {ArrowLeft,ArrowRight,BookOpen,ExternalLink,Tag} from "lucide-react";
import {supabase} from "./lib/supabase";
import type {Guide,Product} from "./types";

const money=(n:number,c:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(n);
const image=(p:Product)=>p.image_url||p.images?.[0]||"https://placehold.co/1000x750/111827/ffffff?text="+encodeURIComponent(p.title.slice(0,24));

export function ProductPage({slug}:{slug:string}){
 const [p,setP]=useState<Product|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{supabase.from("products").select("*").eq("slug",slug).eq("is_active",true).maybeSingle().then(({data})=>{setP(data as Product|null);setLoading(false)})},[slug]);
 if(loading)return <div className="detail-page"><div className="container empty">Loading product...</div></div>;
 if(!p)return <div className="detail-page"><div className="container empty"><h1>Product not found</h1><a className="btn dark" href="/">Back to Affinova</a></div></div>;
 return <div className="detail-page"><div className="container"><a className="back-link" href="/"><ArrowLeft size={15}/> Back to products</a><div className="product-detail"><div className="detail-image"><img src={image(p)} alt={p.title}/></div><div className="detail-copy"><span className="eyebrow">{p.is_deal?<><Tag size={14}/> Featured deal</>:p.brand||"Curated pick"}</span><h1>{p.title}</h1><div className="rating">★ {Number(p.rating||0).toFixed(1)} <span>({p.review_count||0} reviews)</span></div><p className="lead">{p.short_description||p.description||"A curated product pick from Affinova."}</p><div className="detail-price"><strong>{money(Number(p.price),p.currency)}</strong>{p.original_price&&<><del>{money(Number(p.original_price),p.currency)}</del><span>-{p.discount_percentage}%</span></>}</div><a className="btn primary large" href={p.affiliate_url||"#"} target={p.affiliate_url?"_blank":undefined} rel="nofollow sponsored noopener">View deal on AliExpress <ExternalLink size={16}/></a><p className="disclosure">Affiliate disclosure: we may earn a commission if you purchase through this link, at no extra cost to you.</p>{p.key_features?.length>0&&<div className="features"><h2>Key features</h2><ul>{p.key_features.map(x=><li key={x}>{x}</li>)}</ul></div>}</div></div>{p.description&&<section className="detail-description"><span className="eyebrow">Product overview</span><h2>About this product</h2><p>{p.description}</p></section>}</div></div>;
}

export function GuidePage({slug}:{slug:string}){
 const [g,setG]=useState<Guide|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{supabase.from("guides").select("*").eq("slug",slug).eq("is_published",true).maybeSingle().then(({data})=>{setG(data as Guide|null);setLoading(false)})},[slug]);
 if(loading)return <div className="detail-page"><div className="container empty">Loading guide...</div></div>;
 if(!g)return <div className="detail-page"><div className="container empty"><h1>Guide not found</h1><a className="btn dark" href="/">Back to Affinova</a></div></div>;
 return <div className="detail-page"><article className="container guide-detail"><a className="back-link" href="/#guides"><ArrowLeft size={15}/> Back to guides</a>{g.cover_image&&<img className="guide-hero-image" src={g.cover_image} alt=""/>}<span className="eyebrow"><BookOpen size={14}/> {g.category||"Buying guide"}</span><h1>{g.title}</h1>{g.excerpt&&<p className="guide-lead">{g.excerpt}</p>}<div className="guide-meta">{g.author&&<>By {g.author} · </>}{g.published_at?new Date(g.published_at).toLocaleDateString(): "Affinova"}</div><div className="guide-content">{g.content.split(/\n\s*\n/).map((block,i)=><p key={i}>{block}</p>)}</div><a className="text-link" href="/#products">Explore products <ArrowRight size={14}/></a></article></div>;
}
