import {useEffect,useMemo,useState} from "react";
import {supabase} from "./lib/supabase";
import AdminPanel from "./AdminPanel";
import type {Product,Category,Guide} from "./types";
import {ArrowRight,BookOpen,ExternalLink,Heart,LayoutDashboard,LogIn,Menu,Search,ShieldCheck,Sparkles,Tag,X,ChevronLeft,ChevronRight,Package,FolderTree,FileText,Image,BarChart3,House,Settings,LogOut} from "lucide-react";
import AdSlot from "./AdSlot";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminSettings from "./admin/AdminSettings";
import AdminHomepageSections from "./admin/AdminHomepageSections";
import {trackClick,trackPageView,trackSearch} from "./lib/analytics";

const money=(n:number,c:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(n);
const productImage=(p:Product)=>p.image_url||p.images?.[0]||"";
const readIds=(key:string)=>{try{return JSON.parse(localStorage.getItem(key)||"[]") as string[]}catch{return []}};
const saveIds=(key:string,ids:string[])=>localStorage.setItem(key,JSON.stringify(ids));

const editorialImages=[
 "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85",
 "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=85",
 "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1400&q=85",
 "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=85",
 "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1400&q=85"
];
const editorialCategories=["Electronics & Gadgets","Home & Kitchen","Gaming","Toys","Sports & Fitness"];
const guideImages=[
 "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
 "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=80",
 "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
 "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=80",
 "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80"
];

function guideImage(g:Guide,index:number){
 const category=(g.category||"").toLowerCase();
 if(g.cover_image)return g.cover_image;
 if(category.includes("kitchen")||category.includes("home"))return guideImages[1];
 if(category.includes("gaming")||category.includes("tech")||category.includes("gadget"))return guideImages[2];
 if(category.includes("beauty")||category.includes("fashion"))return guideImages[3];
 if(category.includes("sport"))return guideImages[4];
 return guideImages[index%guideImages.length];
}

function Header({query,setQuery,products,categories,savedCount,compareCount}:{query:string;setQuery:(v:string)=>void;products:Product[];categories:Category[];savedCount:number;compareCount:number}){
 const [menu,setMenu]=useState(false);
 const [focus,setFocus]=useState(false);
 const [history,setHistory]=useState<string[]>([]);
 useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("affinova_search_history")||"[]"))}catch{}},[]);
 const saveSearch=(value:string)=>{
  const v=value.trim(); if(!v)return;
  setHistory(prev=>{const next=[v,...prev.filter(x=>x.toLowerCase()!==v.toLowerCase())].slice(0,8);localStorage.setItem("affinova_search_history",JSON.stringify(next));return next});
 };
 const clearHistory=()=>{localStorage.removeItem("affinova_search_history");setHistory([])};
 const suggestions=useMemo(()=>{
  const q=query.trim().toLowerCase();
  if(!q)return [];
  return products.filter(p=>{
   const c=categories.find(x=>x.id===p.category_id);
   const haystack=[p.title,p.brand||"",p.short_description||"",...(p.tags||[]),c?.name||""].join(" ").toLowerCase();
   return haystack.includes(q);
  }).slice(0,6);
 },[query,products,categories]);
 const submit=(e:React.FormEvent)=>{
  e.preventDefault();
  if(query.trim()){saveSearch(query);trackSearch(query,suggestions.length);}
  setFocus(false);
  document.getElementById("products")?.scrollIntoView({behavior:"smooth"});
 };
 return <>
  <div className="top-strip">CURATED FINDS • SMART PICKS • BETTER VALUE <span>New products added regularly</span></div>
  <header className="header">
   <div className="container nav">
    <button className="menu" onClick={()=>setMenu(!menu)} aria-label="Menu">{menu?<X/>:<Menu/>}</button>
    <a className="brand" href="/"><span className="mark">A</span><span>Affinova</span></a>
    <nav className={menu?"links open":"links"}>
     <a href="/#products" onClick={()=>setMenu(false)}>Shop</a><a href="/#categories" onClick={()=>setMenu(false)}>Categories</a><a href="/#deals" onClick={()=>setMenu(false)}>Deals</a><a href="/#guides" onClick={()=>setMenu(false)}>Guides</a><a href="/about" onClick={()=>setMenu(false)}>About</a>
     {savedCount>0&&<a href="#saved" onClick={()=>setMenu(false)}>Saved ({savedCount})</a>}{compareCount>0&&<a href="#compare" onClick={()=>setMenu(false)}>Compare ({compareCount})</a>}
    </nav>
    <form className="search-wrap" onSubmit={submit}>
     <div className="search"><Search size={17}/><input value={query} onFocus={()=>setFocus(true)} onChange={e=>setQuery(e.target.value)} placeholder="Search gadgets, toys, kitchen..."/></div>
     {focus&&<div className="search-results">
      {!query.trim() ? <>{history.length>0?<><div className="search-history-head"><strong>Recent searches</strong><button type="button" onClick={clearHistory}>Clear</button></div>{history.map(h=><button type="button" className="search-history-item" key={h} onClick={()=>{setQuery(h);saveSearch(h);setFocus(false);document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}}><span>↗</span>{h}</button>)}</>:<div className="search-empty">Your recent searches will appear here.</div>}</> : suggestions.length>0 ? suggestions.map(p=>{const c=categories.find(x=>x.id===p.category_id);const img=productImage(p);return <a className="search-result" key={p.id} href={"/product/"+p.slug} onClick={()=>{saveSearch(query);trackSearch(query,1);setFocus(false)}}><div className="search-thumb">{img?<img src={img} alt=""/>:<span>{p.title.slice(0,1)}</span>}</div><div><strong>{p.title}</strong><small>{p.brand||c?.name||"Affinova pick"}{p.tags?.length?" • "+p.tags.slice(0,3).join(", "):""}</small></div></a>}) : <div className="search-empty">No matching product yet.</div>}
     </div>}
    </form>
   </div>
  </header>
 </>;
}
async function openAffiliate(p:Product){
 try{await trackClick("affiliate",p.id,"View deal",p.affiliate_url||undefined)}catch{}
 if(p.affiliate_url) window.open(p.affiliate_url,"_blank","noopener,noreferrer");
}

function Card({p,saved,onSave,compared,onCompare}:{p:Product;saved:boolean;onSave:()=>void;compared:boolean;onCompare:()=>void}){
 const img=productImage(p);
 return <article className="card"><a className="pic" href={"/product/"+p.slug}>{img?<img src={img} alt={p.title}/>:<div className="product-placeholder"><span>{p.category_id?"AFFINOVA":"SMART FIND"}</span><b>{p.title.slice(0,1)}</b></div>}{p.is_deal&&<span className="badge"><Tag size={12}/> Deal</span>}</a><div className="card-body"><div className="rating">★ {Number(p.rating||0).toFixed(1)} <span>({p.review_count||0})</span></div><a className="title" href={"/product/"+p.slug}>{p.title}</a><div className="price"><strong>{money(Number(p.price),p.currency)}</strong>{p.original_price&&<><del>{money(Number(p.original_price),p.currency)}</del><span>-{p.discount_percentage}%</span></>}</div><div className="actions">{p.affiliate_url?<button className="btn dark" type="button" onClick={()=>openAffiliate(p)}>View deal <ExternalLink size={14}/></button>:<a className="btn dark" href={"/product/"+p.slug}>View details <ArrowRight size={14}/></a>}<button className={"heart"+(saved?" saved":"")} aria-label={saved?"Remove from saved":"Save product"} onClick={()=>{trackClick("wishlist",p.id,saved?"remove":"save",location.href);onSave()}}><Heart size={17} fill={saved?"currentColor":"none"}/></button><button className={"compare-btn"+(compared?" active":"")} onClick={()=>{trackClick("compare",p.id,compared?"remove":"add",location.href);onCompare()}}>{compared?"Compared":"Compare"}</button></div></div></article>;
}

function CompareSection({products,onRemove}:{products:Product[];onRemove:(id:string)=>void}){if(!products.length)return null;return <section className="container section" id="compare"><div className="head"><div><span className="eyebrow">Side by side</span><h2>Compare products</h2></div><span className="muted">{products.length}/3 selected</span></div><div className="compare-wrap"><table className="compare-table"><thead><tr><th>Product</th>{products.map(p=><th key={p.id}><button className="remove-compare" onClick={()=>onRemove(p.id)} aria-label={"Remove "+p.title}><X size={14}/></button><img src={productImage(p)||editorialImages[0]} alt=""/><a href={"/product/"+p.slug}>{p.title}</a></th>)}</tr></thead><tbody><tr><td>Price</td>{products.map(p=><td key={p.id}><strong>{money(Number(p.price),p.currency)}</strong></td>)}</tr><tr><td>Rating</td>{products.map(p=><td key={p.id}>★ {Number(p.rating||0).toFixed(1)}</td>)}</tr><tr><td>Reviews</td>{products.map(p=><td key={p.id}>{p.review_count||0}</td>)}</tr></tbody></table></div></section>}

function HeroCarousel({products,categories}:{products:Product[];categories:Category[]}){const [index,setIndex]=useState(0);const slides=useMemo(()=>editorialCategories.map((name,i)=>{const category=categories.find(c=>c.name===name);const product=products.find(p=>p.category_id===category?.id&&productImage(p));return{name,category,product,image:product?productImage(product):editorialImages[i],label:i===0?"TECH ESSENTIALS":i===1?"HOME EDIT":"GAMING ROOM",title:i===0?"Smart gadgets. Better everyday.":i===1?"Make home feel effortless.":i===2?"Level up your setup.":i===3?"Play more. Discover more.":"Move smarter, live better."}}),[products,categories]);useEffect(()=>{const id=window.setInterval(()=>setIndex(i=>(i+1)%slides.length),5000);return()=>window.clearInterval(id)},[slides.length]);const slide=slides[index]||slides[0];return <section className="hero-editorial"><div className="hero-frame"><div className="hero-copy"><span className="eyebrow light"><Sparkles size={14}/> Affinova edit • {slide.name}</span><h1>{slide.title}</h1><p>Hand-picked products across gadgets, toys, kitchen, gaming and everyday essentials — presented simply so you can buy with confidence.</p><a className="hero-btn" href="#products" onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}>Explore the collection <ArrowRight size={17}/></a><div className="hero-progress">{slides.map((s,i)=><button key={s.name} className={i===index?"active":""} onClick={()=>setIndex(i)} aria-label={"Show "+s.name}/>)}</div></div><div className="hero-media"><img key={slide.image} src={slide.image} alt={slide.name}/><div className="hero-overlay"/><div className="hero-label"><small>{slide.label}</small><strong>{slide.name}</strong><span>{slide.product?.brand||"Curated by Affinova"}</span></div><div className="hero-controls"><button onClick={()=>setIndex((index-1+slides.length)%slides.length)} aria-label="Previous"><ChevronLeft/></button><button onClick={()=>setIndex((index+1)%slides.length)} aria-label="Next"><ChevronRight/></button></div></div></div></section>}

function Home(){const [siteSettings,setSiteSettings]=useState<Record<string,any>>({});const [homepageSections,setHomepageSections]=useState<any[]>([]);const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<Category[]>([]),[guides,setGuides]=useState<Guide[]>([]),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");const[savedIds,setSavedIds]=useState<string[]>([]),[compareIds,setCompareIds]=useState<string[]>([]);useEffect(()=>{supabase.from("site_settings").select("key,value").then(({data})=>{const next:Record<string,any>={};(data||[]).forEach(r=>{next[r.key]=r.value});setSiteSettings(next)});setSavedIds(readIds("affinova_wishlist"));setCompareIds(readIds("affinova_compare"));supabase.from("homepage_sections").select("*").eq("is_active",true).order("sort_order").then(({data})=>setHomepageSections(data||[]));(async()=>{const[p,c,g]=await Promise.all([supabase.from("products").select("*").eq("is_active",true).order("created_at",{ascending:false}),supabase.from("categories").select("*").eq("is_active",true).order("sort_order"),supabase.from("guides").select("*").eq("is_published",true).order("published_at",{ascending:false})]);const firstError=p.error||c.error||g.error;if(firstError)setLoadError("We couldn’t load the latest Affinova content. Please refresh and try again.");setProducts((p.data||[])as Product[]);setCategories((c.data||[])as Category[]);setGuides((g.data||[])as Guide[]);setLoading(false)})()},[]);const filtered=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return products;return products.filter(p=>{const category=categories.find(c=>c.id===p.category_id);return(p.title+" "+(p.brand||"")+" "+(p.short_description||"")+" "+(p.tags||[]).join(" ")+" "+(p.key_features||[]).join(" ")+" "+(category?.name||"")).toLowerCase().includes(q)})},[products,categories,query]);const deals=useMemo(()=>products.filter(p=>p.is_deal),[products]);const savedProducts=useMemo(()=>savedIds.map(id=>products.find(p=>p.id===id)).filter(Boolean)as Product[],[savedIds,products]);const compareProducts=useMemo(()=>compareIds.map(id=>products.find(p=>p.id===id)).filter(Boolean).slice(0,3)as Product[],[compareIds,products]);const toggleSave=(id:string)=>setSavedIds(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];saveIds("affinova_wishlist",next);return next});const toggleCompare=(id:string)=>setCompareIds(prev=>{if(prev.includes(id)){const next=prev.filter(x=>x!==id);saveIds("affinova_compare",next);return next}if(prev.length>=3){window.alert("You can compare up to 3 products.");return prev}const next=[...prev,id];saveIds("affinova_compare",next);return next});return <><Header query={query} setQuery={setQuery} products={products} categories={categories} savedCount={savedProducts.length} compareCount={compareProducts.length}/><main><HeroCarousel products={products} categories={categories}/><div className="container ad-container"><AdSlot slot={import.meta.env.VITE_ADSENSE_HOME_SLOT}/></div><section className="editorial-intro container"><span className="eyebrow">The Affinova edit</span><h2>{homepageSections.find(s=>s.section_type==="intro")?.title||"Good products should look this easy."}</h2><p>{homepageSections.find(s=>s.section_type==="intro")?.subtitle||"Explore useful finds without the clutter. We organize the internet into a clean, visual shortlist of things actually worth a closer look."}</p></section><section className="container section category-section" id="categories"><div className="head"><div><span className="eyebrow">Browse the edit</span><h2>Shop by category</h2></div><a className="view-all" href="#products">View all <ArrowRight size={15}/></a></div><div className="category-mosaic">{editorialCategories.slice(0,5).map((name,i)=>{const c=categories.find(x=>x.name===name);return <a href="#products" onClick={()=>setQuery(name)} className={"mosaic-card mosaic-"+i} key={name}><img src={c?.image_url||editorialImages[i]} alt=""/><div><small>{String(i+1).padStart(2,"0")}</small><strong>{name}</strong><span>Explore picks <ArrowRight size={14}/></span></div></a>})}</div></section><section className="container section" id="products"><div className="head"><div><span className="eyebrow">Curated picks</span><h2>{query?(<>Results for “{query}”</>):"Products worth a look"}</h2></div></div>{loadError?<div className="empty"><strong>{loadError}</strong><br/><button className="btn dark" onClick={()=>location.reload()}>Refresh</button></div>:loading?<div className="grid">{[1,2,3,4].map(i=><div className="skeleton" key={i}/>)}</div>:filtered.length?<div className="grid">{filtered.slice(0,8).map(p=><Card p={p} key={p.id} saved={savedIds.includes(p.id)} onSave={()=>toggleSave(p.id)} compared={compareIds.includes(p.id)} onCompare={()=>toggleCompare(p.id)}/>)}</div>:<div className="empty">No matching products yet.</div>}</section>{savedProducts.length>0&&<section className="container section" id="saved"><div className="head"><div><span className="eyebrow">Your shortlist</span><h2>Saved products</h2></div></div><div className="grid">{savedProducts.map(p=><Card p={p} key={p.id} saved onSave={()=>toggleSave(p.id)} compared={compareIds.includes(p.id)} onCompare={()=>toggleCompare(p.id)}/>)}</div></section>}<CompareSection products={compareProducts} onRemove={id=>toggleCompare(id)}/>{deals.length>0&&<section className="dark-section" id="deals"><div className="container section"><div className="head light"><div><span className="eyebrow">Limited-time finds</span><h2>Deals worth opening</h2></div></div><div className="grid">{deals.slice(0,4).map(p=><Card p={p} key={p.id} saved={savedIds.includes(p.id)} onSave={()=>toggleSave(p.id)} compared={compareIds.includes(p.id)} onCompare={()=>toggleCompare(p.id)}/>)}</div></div></section>}<section className="container section" id="guides"><div className="head"><div><span className="eyebrow">Read before you buy</span><h2>Buying guides</h2></div></div><div className="guides">{guides.slice(0,6).map((g,i)=><a className="guide" href={"/guide/"+g.slug} key={g.id}><div className="guide-cover"><img src={guideImage(g,i)} alt=""/></div><div><span>{g.category||"Guide"}</span><h3>{g.title}</h3><p>{g.excerpt||""}</p><b>Read guide <ArrowRight size={14}/></b></div></a>)}</div></section><footer><div className="container footer"><div><div className="brand"><span className="mark">A</span>Affinova</div><p>{siteSettings.footer?.text||siteSettings.general?.tagline||"Product discovery, made simpler. We don't sell or ship products."}</p></div><div><b>Explore</b><a href="/#products">Products</a><a href="/#categories">Categories</a><a href="/#deals">Deals</a><a href="/#guides">Guides</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/affiliate-disclosure">Affiliate disclosure</a><a href="/contact">Contact</a></div><div><b>Disclosure</b><p>Some links on Affinova are affiliate links. If you purchase through our links, we may earn a commission at no additional cost to you.</p></div></div><div className="bottom container"><span>© {new Date().getFullYear()} Affinova</span><small>Made By Muhammad Numair</small></div></footer></main></>}

function ProductDetail({slug}:{slug:string}){
 const [product,setProduct]=useState<Product|null>(null);
 const [related,setRelated]=useState<Product[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [activeImage,setActiveImage]=useState(0);
 useEffect(()=>{let alive=true;(async()=>{
  setLoading(true);setError("");
  const {data,error}=await supabase.from("products").select("*").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!alive)return;
  if(error||!data){setError("Product not found.");setLoading(false);return;}
  const p=data as Product;setProduct(p);
  const {data:relatedData}=await supabase.from("products").select("*").eq("is_active",true).neq("id",p.id).eq("category_id",p.category_id).order("created_at",{ascending:false}).limit(4);
  if(alive)setRelated((relatedData||[]) as Product[]);setLoading(false);
 })();return()=>{alive=false}},[slug]);
 const images=useMemo(()=>Array.from(new Set([product?.image_url||"",...(product?.images||[])].filter(Boolean))),[product]);
 useEffect(()=>setActiveImage(0),[product?.id]);
 if(loading)return <><Header query="" setQuery={()=>{}} products={[]} categories={[]} savedCount={0} compareCount={0}/><main className="detail-page"><div className="container"><div className="detail-skeleton"/></div></main></>;
 if(!product||error)return <><Header query="" setQuery={()=>{}} products={[]} categories={[]} savedCount={0} compareCount={0}/><main className="detail-page"><div className="container detail-error"><span className="eyebrow">Affinova</span><h1>Product not found</h1><p>This product may have been removed or is no longer available.</p><a className="btn dark" href="/#products">Back to products</a></div></main></>;
 const discount=product.original_price&&Number(product.original_price)>Number(product.price)?Math.round((1-Number(product.price)/Number(product.original_price))*100):Number(product.discount_percentage||0);
 const image=images[activeImage]||"";
 const openDeal=()=>openAffiliate(product);
 return <><Header query="" setQuery={()=>{}} products={[]} categories={[]} savedCount={0} compareCount={0}/><main className="detail-page"><div className="container">
  <a className="back-link" href="/#products"><ChevronLeft size={14}/> Back to products</a>
  <div className="product-detail">
   <div className="detail-gallery"><div className="detail-image">{image?<img src={image} alt={product.title}/>:<div className="product-placeholder"><span>AFFINOVA</span><b>{product.title.slice(0,1)}</b></div>}{product.is_deal&&<span className="detail-badge"><Tag size={13}/> Deal</span>}</div>{images.length>1&&<div className="detail-thumbs">{images.map((src,i)=><button key={src+i} className={i===activeImage?"active":""} onClick={()=>setActiveImage(i)} aria-label={"View image "+(i+1)}><img src={src} alt=""/></button>)}</div>}</div>
   <div className="detail-copy"><span className="eyebrow">{product.brand||"Affinova pick"}{product.source?" • "+product.source:""}</span><h1>{product.title}</h1>{product.short_description&&<p className="lead">{product.short_description}</p>}<div className="detail-rating"><span>★ {Number(product.rating||0).toFixed(1)}</span><span>{product.review_count||0} reviews</span></div><div className="detail-price"><strong>{money(Number(product.price),product.currency)}</strong>{product.original_price&&<del>{money(Number(product.original_price),product.currency)}</del>}{discount>0&&<span>-{discount}%</span>}</div><button className="btn dark detail-buy" onClick={openDeal} disabled={!product.affiliate_url}>{product.affiliate_url?<>View on AliExpress <ExternalLink size={15}/></>:<>Affiliate link unavailable</>}</button><p className="disclosure">Some links are affiliate links. If you purchase through one, Affinova may earn a commission at no extra cost to you.</p>{product.key_features?.length>0&&<div className="features"><h2>Key features</h2><ul>{product.key_features.map((f,i)=><li key={i}>{f}</li>)}</ul></div>}{product.tags?.length>0&&<div className="detail-tags">{product.tags.map(t=><span key={t}>{t}</span>)}</div>}</div>
  </div>
  <div className="detail-description">{product.description&&<><h2>About this product</h2><p>{product.description}</p></>}{product.affiliate_url&&<div className="detail-ad"><AdSlot slot={import.meta.env.VITE_ADSENSE_PRODUCT_SLOT||import.meta.env.VITE_ADSENSE_HOME_SLOT}/></div>}</div>
  {related.length>0&&<section className="detail-related"><div className="head"><div><span className="eyebrow">You may also like</span><h2>More from this category</h2></div></div><div className="grid">{related.map(p=><Card key={p.id} p={p} saved={false} onSave={()=>{}} compared={false} onCompare={()=>{}}/>)}</div></section>}
 </div></main></>;
}

function cleanPublicHtml(html:string){return html.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<iframe[\s\S]*?<\/iframe>/gi,"").replace(/<object[\s\S]*?<\/object>/gi,"").replace(/<embed[\s\S]*?>/gi,"").replace(/ on[a-z]+\s*=\s*(["']).*?\1/gi,"").replace(/javascript:/gi,"");}
function PublicPage({slug}:{slug:string}){const [page,setPage]=useState<any>(null);const [loading,setLoading]=useState(true);useEffect(()=>{let alive=true;supabase.from("content_pages").select("*").eq("slug",slug).eq("is_published",true).maybeSingle().then(({data})=>{if(alive){setPage(data);setLoading(false)}});return()=>{alive=false}},[slug]);if(loading)return <div className="public-page container"><div className="skeleton"/></div>;if(!page)return <div className="public-page container"><h1>Page not found</h1><a className="btn dark" href="/">Back to Affinova</a></div>;return <><header className="header"><div className="container nav"><a className="brand" href="/"><span className="mark">A</span><span>Affinova</span></a><nav className="links open"><a href="/">Home</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div></header><main className="public-page container"><span className="eyebrow">Affinova</span><h1>{page.title}</h1>{page.excerpt&&<p className="page-excerpt">{page.excerpt}</p>}<article className="page-content" dangerouslySetInnerHTML={{__html:cleanPublicHtml(page.content||"")}} /></main><footer><div className="container bottom"><span>© {new Date().getFullYear()} Affinova</span><small>Made By Muhammad Numair</small></div></footer></>}


function AdminNav({tab,view,open,setOpen}:{tab:string|null;view:string|null;open:boolean;setOpen:(v:boolean)=>void}){
 return <aside className={open?"open":""}>
  <div className="admin-mobile-head"><button className="admin-menu-btn" onClick={()=>setOpen(!open)} aria-label="Toggle admin menu">{open?<X size={21}/>:<Menu size={21}/>}</button><button className="admin-brand" onClick={()=>{setOpen(false);location.href="/admin"}}><span className="mark">A</span><span>Affinova</span></button></div>
  <div className="admin-brand-desktop"><button className="admin-brand" onClick={()=>{setOpen(false);location.href="/admin"}}><span className="mark">A</span><span>Affinova</span></button></div>
  <small>ADMIN CONTROL CENTER</small>
  <a className={"side"+(!tab&&!view?" active":"")} href="/admin" onClick={()=>setOpen(false)}><LayoutDashboard size={17}/> <span>Dashboard</span></a>
  <a className={"side"+(tab==="products"?" active":"")} href="/admin?tab=products" onClick={()=>setOpen(false)}><Package size={17}/> <span>Products</span></a>
  <a className={"side"+(tab==="categories"?" active":"")} href="/admin?tab=categories" onClick={()=>setOpen(false)}><FolderTree size={17}/> <span>Categories</span></a>
  <a className={"side"+(tab==="guides"?" active":"")} href="/admin?tab=guides" onClick={()=>setOpen(false)}><BookOpen size={17}/> <span>Guides</span></a>
  <a className={"side"+(tab==="pages"?" active":"")} href="/admin?tab=pages" onClick={()=>setOpen(false)}><FileText size={17}/> <span>Pages</span></a>
  <a className={"side"+(tab==="media"?" active":"")} href="/admin?tab=media" onClick={()=>setOpen(false)}><Image size={17}/> <span>Media</span></a>
  <a className={"side"+(view==="analytics"?" active":"")} href="/admin?view=analytics" onClick={()=>setOpen(false)}><BarChart3 size={17}/> <span>Analytics</span></a>
  <a className={"side"+(view==="homepage"?" active":"")} href="/admin?view=homepage" onClick={()=>setOpen(false)}><House size={17}/> <span>Homepage</span></a>
  <a className={"side"+(view==="settings"?" active":"")} href="/admin?view=settings" onClick={()=>setOpen(false)}><Settings size={17}/> <span>Settings</span></a>
  <button className="side signout" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/> <span>Sign out</span></button>
 </aside>
}

function Admin(){
 const[session,setSession]=useState<any>(null),[role,setRole]=useState<string|null>(null),[roleLoading,setRoleLoading]=useState(true),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[message,setMessage]=useState(""),[menuOpen,setMenuOpen]=useState(false);
 const load=async()=>{setRoleLoading(true);const{data:{session}}=await supabase.auth.getSession();setSession(session);if(!session?.user){setRole(null);setRoleLoading(false);return}const{data,error}=await supabase.rpc("get_my_role");setRole(error?null:(data||null));setRoleLoading(false)};
 useEffect(()=>{load();const{data}=supabase.auth.onAuthStateChange((_event,nextSession)=>{setSession(nextSession);if(nextSession)setTimeout(()=>load(),0);else{setRole(null);setRoleLoading(false)}});return()=>data.subscription.unsubscribe()},[]);
 const login=async(e:React.FormEvent)=>{e.preventDefault();setMessage("");const{error}=await supabase.auth.signInWithPassword({email,password});setMessage(error?.message||"Signed in.")};
 const googleLogin=async()=>{setMessage("");const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/admin"}});if(error)setMessage(error.message)};
 if(!session)return <div className="admin-page"><div className="login"><button className="admin-brand login-brand" onClick={()=>location.href="/admin"}><span className="mark">A</span>Affinova</button><h1>Admin sign in</h1><p>Only authorized Affinova administrators can enter this area.</p><button type="button" className="btn dark full" onClick={googleLogin}><LogIn size={15}/> Continue with Google</button><div className="login-divider"><span>or use email & password</span></div><form onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary full"><LogIn size={15}/> Sign in</button></form>{message&&<div className="notice">{message}</div>}<button className="back-site" onClick={()=>location.href="/"}>← Back to site</button></div></div>;
 if(roleLoading)return <div className="admin-page"><div className="login"><ShieldCheck size={40}/><h1>Verifying administrator access…</h1><p>Your account is signed in, but Affinova is checking the administrator role before opening the dashboard.</p></div></div>;
 if(role!=="admin")return <div className="admin-page"><div className="login"><ShieldCheck size={40}/><h1>Access denied</h1><p>This account is signed in but isn't an Affinova administrator.</p><button className="btn dark full" onClick={()=>supabase.auth.signOut()}>Sign out</button><button className="back-site" onClick={()=>location.href="/"}>← Back to site</button></div></div>;
 const params=new URLSearchParams(location.search),view=params.get("view"),tab=params.get("tab");
 const title=tab==="products"?"Products":tab==="categories"?"Categories":tab==="guides"?"Guides":tab==="pages"?"Pages":tab==="media"?"Media":view==="analytics"?"Analytics":view==="homepage"?"Homepage":view==="settings"?"Settings":"Dashboard";
 let content:React.ReactNode;
 if(view==="analytics")content=<AdminAnalytics/>;else if(view==="settings")content=<AdminSettings/>;else if(view==="homepage")content=<AdminHomepageSections/>;else content=<AdminPanel/>;
 return <div className="admin-shell"><AdminNav tab={tab} view={view} open={menuOpen} setOpen={setMenuOpen}/><div className={menuOpen?"admin-menu-backdrop show":"admin-menu-backdrop"} onClick={()=>setMenuOpen(false)}/><section className="admin-main"><div className="admin-top"><div><span className="eyebrow">Control center</span><h1>{title}</h1><p className="admin-subtitle">Manage Affinova content, discovery and performance.</p></div><div className="admin-top-actions"><button className="admin-mobile-menu-trigger" onClick={()=>setMenuOpen(true)}><Menu size={18}/> Menu</button><button className="btn dark" onClick={()=>location.href="/"}>View site <ExternalLink size={14}/></button></div></div><div className="stats"><div><span>Signed in as</span><strong>{session.user.email}</strong></div><div><span>Role</span><strong>{role}</strong></div><div><span>Backend</span><strong>Supabase</strong></div></div>{content}</section></div>
}
export default function App(){
 const publicSlug=location.pathname.startsWith("/about")?"about":location.pathname.startsWith("/contact")?"contact":location.pathname.startsWith("/privacy")?"privacy":location.pathname.startsWith("/terms")?"terms":location.pathname.startsWith("/affiliate-disclosure")?"affiliate-disclosure":null;
 useEffect(()=>{
  if(location.pathname.startsWith("/admin")) return;
  const slug=location.pathname.startsWith("/product/")?decodeURIComponent(location.pathname.split("/")[2]||""):null;
  if(slug){supabase.from("products").select("id").eq("slug",slug).maybeSingle().then(({data})=>trackPageView(data?.id||null));}
  else trackPageView();
 },[location.pathname,location.search]);
 if(location.pathname.startsWith("/admin")) return <Admin/>;
 if(publicSlug) return <PublicPage slug={publicSlug}/>;
 return <Home/>
}
