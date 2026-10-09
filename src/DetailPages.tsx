import {useEffect,useState} from "react";
import {ArrowLeft,ArrowRight,BookOpen,ExternalLink,Tag} from "lucide-react";
import AdSlot from "./AdSlot";
import {supabase} from "./lib/supabase";
import {trackClick} from "./lib/analytics";
import type {Guide,Product} from "./types";

const money=(n:number,c:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(n);
const image=(p:Product)=>p.image_url||p.images?.[0]||"https://placehold.co/1000x750/111827/ffffff?text="+encodeURIComponent(p.title.slice(0,24));

function setMeta(title:string,description:string,url:string,imageUrl?:string,type="website"){
 document.title=title;
 const set=(selector:string,attr:string,value:string)=>{let el=document.querySelector(selector) as HTMLMetaElement|HTMLLinkElement|null;if(!el){el=document.createElement(selector.startsWith("link")?"link":"meta");if(selector.startsWith("link"))(el as HTMLLinkElement).rel=selector.includes('canonical')?"canonical":"alternate";else{const m=el as HTMLMetaElement;m.name=selector.includes('description')?"description":"";if(selector.includes('property='))m.setAttribute("property",selector.match(/property="([^"]+)"/)?.[1]||"")};document.head.appendChild(el)}el.setAttribute(attr,value)};
 set('meta[name="description"]',"content",description);
 set('link[rel="canonical"]',"href",url);
 set('meta[property="og:title"]',"content",title);
 set('meta[property="og:description"]',"content",description);
 set('meta[property="og:type"]',"content",type);
 set('meta[property="og:url"]',"content",url);
 set('meta[name="twitter:card"]',"content","summary_large_image");
 set('meta[name="twitter:title"]',"content",title);
 set('meta[name="twitter:description"]',"content",description);
 if(imageUrl){set('meta[property="og:image"]',"content",imageUrl);set('meta[name="twitter:image"]',"content",imageUrl)}
}

function setJsonLd(id:string,data:Record<string,unknown>){
 let el=document.getElementById(id) as HTMLScriptElement|null;
 if(!el){el=document.createElement("script");el.id=id;el.type="application/ld+json";document.head.appendChild(el)}
 el.textContent=JSON.stringify(data);
 return()=>el?.remove();
}

export function ProductPage({slug}:{slug:string}){
 const [p,setP]=useState<Product|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let alive=true;
  supabase.from("products").select("*").eq("slug",slug).eq("is_active",true).maybeSingle().then(({data})=>{
   if(!alive)return;
   const product=data as Product|null;setP(product);setLoading(false);
   if(product){
    const description=product.short_description||product.description||"Discover this curated product on Affinova.";
    const url=location.origin+"/product/"+encodeURIComponent(product.slug);
    setMeta(product.title+" — Affinova",description,url,image(product),"product");
    const cleanup=setJsonLd("affinova-product-jsonld",{ "@context":"https://schema.org","@type":"Product",name:product.title,description,image:image(product),brand:product.brand?{"@type":"Brand",name:product.brand}:undefined,aggregateRating:product.review_count>0?{"@type":"AggregateRating",ratingValue:Number(product.rating||0),reviewCount:Number(product.review_count||0)}:undefined,offers:{"@type":"Offer",price:Number(product.price),priceCurrency:product.currency||"USD",availability:product.is_active?"https://schema.org/InStock":"https://schema.org/OutOfStock"}});
    (window as any).__affinovaProductCleanup=cleanup;
   }
  });
  return()=>{alive=false;(window as any).__affinovaProductCleanup?.();delete (window as any).__affinovaProductCleanup};
 },[slug]);
 if(loading)return <div className="detail-page"><div className="container empty">Loading product...</div></div>;
 if(!p)return <div className="detail-page"><div className="container empty"><h1>Product not found</h1><a className="btn dark" href="/">Back to Affinova</a></div></div>;
 return <div className="detail-page"><div className="container"><a className="back-link" href="/"><ArrowLeft size={15}/> Back to products</a><div className="product-detail"><div className="detail-image"><img src={image(p)} alt={p.title}/></div><div className="detail-copy"><span className="eyebrow">{p.is_deal?<><Tag size={14}/> Featured deal</>:p.brand||"Curated pick"}</span><h1>{p.title}</h1><div className="rating">★ {Number(p.rating||0).toFixed(1)} <span>({p.review_count||0} reviews)</span></div><p className="lead">{p.short_description||p.description||"A curated product pick from Affinova."}</p><div className="detail-price"><strong>{money(Number(p.price),p.currency)}</strong>{p.original_price&&<><del>{money(Number(p.original_price),p.currency)}</del><span>-{p.discount_percentage}%</span></>}</div>{p.affiliate_url?<a className="btn primary large" href={p.affiliate_url} target="_blank" rel="nofollow sponsored noopener" onClick={()=>{void trackClick("affiliate",p.id,"View deal",p.affiliate_url||undefined)}}>View deal on AliExpress <ExternalLink size={16}/></a>:<a className="btn dark large" href={"/#products"}>Explore more products <ArrowRight size={16}/></a>}<p className="disclosure">Affiliate disclosure: we may earn a commission if you purchase through this link, at no extra cost to you.</p>{p.key_features?.length>0&&<div className="features"><h2>Key features</h2><ul>{p.key_features.map(x=><li key={x}>{x}</li>)}</ul></div>}</div></div><div className="ad-container detail-ad"><AdSlot slot={import.meta.env.VITE_ADSENSE_DETAIL_SLOT}/></div>{p.description&&<section className="detail-description"><span className="eyebrow">Product overview</span><h2>About this product</h2><p>{p.description}</p></section>}</div></div>;
}

export function GuidePage({slug}:{slug:string}){
 const [g,setG]=useState<Guide|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  let alive=true;
  supabase.from("guides").select("*").eq("slug",slug).eq("is_published",true).maybeSingle().then(({data})=>{
   if(!alive)return;
   const guide=data as Guide|null;setG(guide);setLoading(false);
   if(guide){
    const description=guide.excerpt||"Read this buying guide on Affinova.";
    const url=location.origin+"/guide/"+encodeURIComponent(guide.slug);
    setMeta(guide.title+" — Affinova",description,url,guide.cover_image||undefined,"article");
    const cleanup=setJsonLd("affinova-guide-jsonld",{"@context":"https://schema.org","@type":"Article",headline:guide.title,description,author:{"@type":"Person",name:guide.author||"Affinova"},datePublished:guide.published_at||undefined,image:guide.cover_image||undefined,mainEntityOfPage:url});
    (window as any).__affinovaGuideCleanup=cleanup;
   }
  });
  return()=>{alive=false;(window as any).__affinovaGuideCleanup?.();delete (window as any).__affinovaGuideCleanup};
 },[slug]);
 if(loading)return <div className="detail-page"><div className="container empty">Loading guide...</div></div>;
 if(!g)return <div className="detail-page"><div className="container empty"><h1>Guide not found</h1><a className="btn dark" href="/">Back to Affinova</a></div></div>;
 return <div className="detail-page"><article className="container guide-detail"><a className="back-link" href="/#guides"><ArrowLeft size={15}/> Back to guides</a>{g.cover_image&&<img className="guide-hero-image" src={g.cover_image} alt=""/>}<span className="eyebrow"><BookOpen size={14}/> {g.category||"Buying guide"}</span><h1>{g.title}</h1>{g.excerpt&&<p className="guide-lead">{g.excerpt}</p>}<div className="guide-meta">{g.author&&<>By {g.author} · </>}{g.published_at?new Date(g.published_at).toLocaleDateString(): "Affinova"}</div><div className="guide-content">{g.content.split(/\n\s*\n/).map((block,i)=><p key={i}>{block}</p>)}</div><div className="ad-container guide-ad"><AdSlot slot={import.meta.env.VITE_ADSENSE_GUIDE_SLOT}/></div><a className="text-link" href="/#products">Explore products <ArrowRight size={14}/></a></article></div>;
}
