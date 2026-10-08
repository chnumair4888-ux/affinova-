const CJ_LINK_ENDPOINT = "https://link-search.api.cj.com/v2/link-search";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vrebunefcbcqfmllxsdm.supabase.co";
const CJ_PID = process.env.CJ_PID || "101893390";
const CJ_TOKEN = process.env.CJ_API_TOKEN;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CJ_TOKEN) throw new Error("Missing CJ_API_TOKEN secret.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY secret.");

const keywords = ["electronics","gadgets","smart home","kitchen","home","gaming","toys","sports","fitness","beauty","fashion","office"];

async function supabase(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${body.slice(0, 1500)}`);
  return body ? JSON.parse(body) : null;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70);
}

async function loadCategories() {
  return supabase("categories?select=id,name,slug&is_active=eq.true");
}

function pickCategory(product, categories) {
  const text = [product.title, product.advertiserName, product.category].filter(Boolean).join(" ").toLowerCase();
  const rules = [
    ["gaming",["gaming","game","playstation","xbox","nintendo","controller","console"]],
    ["toys",["toy","lego","doll","puzzle","kids","playset"]],
    ["sports",["sport","fitness","gym","running","football","basketball","yoga","cycling"]],
    ["beauty",["beauty","makeup","cosmetic","skincare","hair","perfume"]],
    ["fashion",["fashion","clothing","shirt","shoe","dress","jacket","apparel"]],
    ["kitchen",["kitchen","cook","coffee","blender","mixer","utensil","pan"]],
    ["home",["home","furniture","decor","storage","cleaning"]],
    ["electronics",["electronic","gadget","phone","tablet","laptop","computer","camera","headphone","speaker","charger","watch","smart home"]]
  ];
  for (const [key, words] of rules) {
    if (words.some(word => text.includes(word))) {
      const match = categories.find(c => String(c.slug || c.name).toLowerCase().includes(key));
      if (match) return match.id;
    }
  }
  return null;
}

function xmlDecode(value="") {
  return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}
function xmlValue(block,names) {
  for (const name of names) {
    const m = block.match(new RegExp("<"+name+"[^>]*>([\\s\\S]*?)</"+name+">","i"));
    if (m) return xmlDecode(m[1].replace(/<[^>]+>/g,"").trim());
  }
  return "";
}

async function fetchLinkProducts(keyword) {
  const params = new URLSearchParams({"website-id":CJ_PID,"advertiser-ids":"joined",keywords:keyword,"records-per-page":"100","page-number":"1"});
  const res = await fetch(`${CJ_LINK_ENDPOINT}?${params.toString()}`, {headers:{Authorization:`Bearer ${CJ_TOKEN}`,Accept:"application/xml, text/xml, application/json"}});
  const raw = await res.text();
  if (!res.ok) throw new Error(`CJ Link Search HTTP ${res.status}: ${raw.slice(0,1200)}`);
  if (raw.trim().startsWith("{")) {
    const json=JSON.parse(raw);
    const links=json.links || json.results || [];
    return links.map(link=>({
      id:String(link.linkId||link.id||link.linkID||""),
      advertiserId:String(link.advertiserId||""),
      advertiserName:link.advertiserName||link.advertiser||"",
      title:link.linkName||link.name||link.title||"",
      description:link.description||"",
      clickUrl:link.clickUrl||link.clickURL||link.linkUrl||link.linkURL||"",
      destinationUrl:link.destinationUrl||link.destinationURL||"",
      imageUrl:link.imageUrl||link.imageURL||"",
      category:link.category||link.subCategory||"",
      linkType:link.linkType||""
    })).filter(p=>p.id && (p.title||p.clickUrl||p.destinationUrl));
  }
  const blocks=raw.match(/<link[^>]*>[\s\S]*?<\/link>/gi)||[];
  return blocks.map(block=>({
    id:xmlValue(block,["linkId","id","linkID"]),
    advertiserId:xmlValue(block,["advertiserId","advertiserID"]),
    advertiserName:xmlValue(block,["advertiserName","advertiser"]),
    title:xmlValue(block,["linkName","name","title"]),
    description:xmlValue(block,["description","linkDescription"]),
    clickUrl:xmlValue(block,["clickUrl","clickURL","linkUrl","linkURL"]),
    destinationUrl:xmlValue(block,["destinationUrl","destinationURL"]),
    imageUrl:xmlValue(block,["imageUrl","imageURL","image"]),
    category:xmlValue(block,["category","subCategory"]),
    linkType:xmlValue(block,["linkType"])
  })).filter(p=>p.id && (p.title||p.clickUrl||p.destinationUrl));
}

async function upsertProducts(products,categories) {
  const unique=new Map(products.map(p=>[String(p.id),p]));
  const rows=[];
  for (const p of unique.values()) {
    const title=String(p.title||p.advertiserName||"").trim();
    const affiliateUrl=p.clickUrl||p.destinationUrl||null;
    if (!title||!affiliateUrl) continue;
    const description=String(p.description||`${p.advertiserName||"CJ"} affiliate offer`).replace(/\s+/g," ").slice(0,1000);
    rows.push({title,slug:`cj-${slugify(p.id)}`,short_description:description.slice(0,220)||null,description,price:0,original_price:null,currency:"USD",rating:0,review_count:0,image_url:p.imageUrl||null,affiliate_url:affiliateUrl,brand:p.advertiserName||"CJ Affiliate",category_id:pickCategory(p,categories),tags:[p.category,p.advertiserName,p.linkType].filter(Boolean).map(String).slice(0,20),key_features:[],is_featured:false,is_deal:false,is_active:true,is_sample:false});
  }
  for(let i=0;i<rows.length;i+=50) await supabase("products?on_conflict=slug",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows.slice(i,i+50))});
  return rows.length;
}

const categories=await loadCategories();
let all=[];
console.log("CJ sync: using Link Search API for joined affiliate links");
for(let i=0;i<keywords.length;i++){
  const keyword=keywords[i];
  console.log(`CJ link search: ${keyword} (${i+1}/${keywords.length})`);
  const links=await fetchLinkProducts(keyword);
  console.log(`  received ${links.length} links`);
  all.push(...links);
  if(i<keywords.length-1) await new Promise(resolve=>setTimeout(resolve,2500));
}
if(all.length===0) console.log("CJ sync: no joined affiliate links returned. Check CJ advertiser relationships and the PID.");
const imported=await upsertProducts(all,categories);
console.log(`CJ sync complete: ${imported} products processed from ${new Set(all.map(p=>p.id)).size} unique CJ links.`);
