import {writeFileSync,mkdirSync} from "node:fs";

const site="https://affinova.cyou";
const urls=new Set(["/","/about","/privacy","/terms","/affiliate-disclosure","/contact"]);
const base=process.env.VITE_SUPABASE_URL;
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;

if(base&&key){
  const headers={apikey:key,Authorization:"Bearer "+key};
  async function add(path,prefix){
    try{
      const r=await fetch(base+"/rest/v1/"+path,{headers});
      if(!r.ok)return;
      const rows=await r.json();
      for(const row of rows) if(row.slug) urls.add(prefix+"/"+encodeURIComponent(row.slug));
    }catch{}
  }
  await add("products?select=slug&is_active=eq.true","/product");
  await add("guides?select=slug&is_published=eq.true","/guide");
}

const body=[...urls].map(path=>"<url><loc>"+site+path+"</loc></url>").join("\n");
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+body+"\n</urlset>\n";
mkdirSync("public",{recursive:true});
writeFileSync("public/sitemap.xml",xml);
console.log("Affinova sitemap generated:",urls.size,"URLs");
