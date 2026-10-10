const API = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || "affinova";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vrebunefcbcqfmllxsdm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
import crypto from "node:crypto";
if (!APP_KEY) throw new Error("Missing ALIEXPRESS_APP_KEY secret.");
if (!APP_SECRET) throw new Error("Missing ALIEXPRESS_APP_SECRET secret.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY secret.");
async function supabase(path, options = {}) { const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {...options, headers:{apikey:SUPABASE_SERVICE_ROLE_KEY, Authorization:"Bearer "+SUPABASE_SERVICE_ROLE_KEY, "Content-Type":"application/json", ...(options.headers||{})}}); const body=await res.text(); if(!res.ok) throw new Error("Supabase "+res.status+": "+body.slice(0,1500)); return body?JSON.parse(body):null; }
function sign(params){ const plain=Object.keys(params).filter(k=>k!=="sign").sort().map(k=>k+params[k]).join(""); return crypto.createHmac("md5",APP_SECRET).update(plain,"utf8").digest("hex").toUpperCase(); }
const text=v=>v==null?"":String(v).trim(); const first=(...v)=>v.find(x=>text(x))||""; const arr=v=>Array.isArray(v)?v:(v?[v]:[]);
const get=(o,...keys)=>{for(const k of keys){if(o&&o[k]!=null)return o[k]}return ""};
async function fetchWithRetry(url, options, label) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        const waitMs = attempt * 3000;
        console.warn(label + " HTTP " + res.status + "; retry " + (attempt + 1) + "/" + maxAttempts + " in " + waitMs + "ms");
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return res;
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw new Error(label + " connection failed after " + maxAttempts + " attempts: " + (error?.cause?.code || error?.code || error?.message || "unknown network error"));
      }
      const waitMs = attempt * 3000;
      console.warn(label + " network error (" + (error?.cause?.code || error?.code || error?.message || "unknown") + "); retry " + (attempt + 1) + "/" + maxAttempts + " in " + waitMs + "ms");
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw new Error(label + " request failed after retries.");
}
async function query(keyword){ const timestamp=new Date().toISOString().replace("T"," ").replace(/\.\d{3}Z$/,""); const params={app_key:APP_KEY,format:"json",method:"aliexpress.affiliate.product.query",partner_id:"affinova",sign_method:"hmac",timestamp,v:"2.0",keywords:keyword,page_no:"1",page_size:"50",target_currency:"USD",target_language:"EN",tracking_id:TRACKING_ID,ship_to_country:"PK"}; params.sign=sign(params); const res=await fetchWithRetry(API,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded;charset=UTF-8"},body:new URLSearchParams(params)},"AliExpress API"); const raw=await res.text(); if(!res.ok)throw new Error("AliExpress HTTP "+res.status+": "+raw.slice(0,2000)); let json; try{json=JSON.parse(raw)}catch{throw new Error("AliExpress returned non-JSON: "+raw.slice(0,1000))}; const err=json?.error_response||json?.errorResponse; if(err)throw new Error("AliExpress API error: "+JSON.stringify(err).slice(0,1800)); return json?.aliexpress_affiliate_product_query_response?.resp_result||json?.aliexpress_affiliate_product_query_response?.result||json?.result||{}; }
function extractProducts(result){ const candidates=[result?.result?.products?.product,result?.products?.product,result?.products,result?.result?.products,result?.data?.products]; for(const c of candidates){const a=arr(c);if(a.length)return a;} return []; }
async function loadCategories(){return supabase("categories?select=id,name,slug&is_active=eq.true");}
function pickCategory(p,categories){ const s=[get(p,"product_title","productTitle"),get(p,"first_level_category_name","firstLevelCategoryName"),get(p,"second_level_category_name","secondLevelCategoryName")].join(" ").toLowerCase(); const rules=[["gaming",["gaming","game","playstation","xbox","nintendo","controller","console"]],["toys",["toy","lego","doll","puzzle","kids","playset"]],["sports",["sport","fitness","gym","running","football","basketball","yoga","cycling"]],["kitchen",["kitchen","cook","coffee","blender","mixer","utensil","pan"]],["home",["home","furniture","decor","storage","cleaning"]],["electronics",["electronic","gadget","phone","tablet","laptop","computer","camera","headphone","speaker","charger","watch","smart"]]]; for(const [key,words] of rules){if(words.some(w=>s.includes(w))){const c=categories.find(x=>String(x.slug||x.name).toLowerCase().includes(key));if(c)return c.id;}} return null; }
function slugify(v){return text(v).toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70);}
function normalize(p,categories){ const id=text(get(p,"product_id","productId","id")); const title=text(get(p,"product_title","productTitle","title")); if(!id||!title)return null; const price=Number(first(get(p,"target_sale_price","targetSalePrice"),get(p,"sale_price","salePrice"),get(p,"app_sale_price","appSalePrice"),0)); const original=Number(first(get(p,"target_original_price","targetOriginalPrice"),get(p,"original_price","originalPrice"),0))||null; const image=first(get(p,"product_main_image_url","productMainImageUrl"),get(p,"product_main_image","productMainImage"),arr(get(p,"product_small_image_urls","productSmallImageUrls"))[0]); const url=first(get(p,"promotion_link","promotionLink"),get(p,"affiliate_link","affiliateLink"),get(p,"product_detail_url","productDetailUrl")); const commission=first(get(p,"commission_rate","commissionRate")); return {title,slug:"ae-"+slugify(id),short_description:title.slice(0,220),description:text(get(p,"product_detail_url","productDetailUrl"))?("AliExpress product: "+text(get(p,"product_detail_url","productDetailUrl"))):null,price:Number.isFinite(price)?price:0,original_price:original,currency:"USD",rating:0,review_count:0,image_url:image||null,affiliate_url:url||null,brand:first(get(p,"brand_name","brandName"),"AliExpress"),category_id:pickCategory(p,categories),tags:["AliExpress",text(get(p,"first_level_category_name","firstLevelCategoryName")),text(get(p,"second_level_category_name","secondLevelCategoryName")),commission?("commission "+commission+"%"):""].filter(Boolean).slice(0,20),key_features:[],is_featured:false,is_deal:Boolean(original&&price&&original>price),is_active:Boolean(url),is_sample:false,source:"aliexpress",external_id:id}; }
const categories=await loadCategories(); const keywords=(process.env.ALIEXPRESS_KEYWORDS||"gadgets,electronics,home kitchen,gaming,toys,sports fitness").split(",").map(x=>x.trim()).filter(Boolean); const all=[];
for(const keyword of keywords){console.log("AliExpress search: "+keyword); const result=await query(keyword); const products=extractProducts(result); console.log(" received "+products.length); for(const p of products){const row=normalize(p,categories);if(row&&row.affiliate_url)all.push(row);} await new Promise(r=>setTimeout(r,1200));}
const unique=[...new Map(all.map(p=>[p.external_id,p])).values()]; for(let i=0;i<unique.length;i+=50){await supabase("products?on_conflict=slug",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(unique.slice(i,i+50))});} console.log("AliExpress sync complete: "+unique.length+" real products processed.");