const CJ_ENDPOINT = "https://ads.api.cj.com/query";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vrebunefcbcqfmllxsdm.supabase.co";
const CJ_CID = process.env.CJ_CID || "8093374";
const CJ_PID = process.env.CJ_PID || "101893390";
const CJ_TOKEN = process.env.CJ_API_TOKEN;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CJ_TOKEN) throw new Error("Missing CJ_API_TOKEN secret.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY secret.");

const keywords = [
  "electronics", "gadgets", "smart home", "kitchen", "home",
  "gaming", "toys", "sports", "fitness", "beauty", "fashion"
];

async function cj(query) {
  const res = await fetch(CJ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CJ_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`CJ HTTP ${res.status}: ${JSON.stringify(body).slice(0, 1200)}`);
  if (body.errors?.length) throw new Error(`CJ GraphQL: ${JSON.stringify(body.errors).slice(0, 1800)}`);
  return body.data;
}

async function supabase(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 1500)}`);
  return text ? JSON.parse(text) : null;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function pickCategory(product, categories) {
  const text = [
    product.title,
    product.brand,
    product.advertiserName,
    ...(product.productType || []),
    product.googleProductCategory?.name,
  ].filter(Boolean).join(" ").toLowerCase();

  const rules = [
    ["gaming", ["gaming", "game", "playstation", "xbox", "nintendo", "controller", "console"]],
    ["toys", ["toy", "lego", "doll", "puzzle", "kids", "kid", "playset"]],
    ["sports", ["sport", "fitness", "gym", "running", "football", "basketball", "yoga", "cycling"]],
    ["beauty", ["beauty", "makeup", "cosmetic", "skincare", "hair", "perfume"]],
    ["fashion", ["fashion", "clothing", "shirt", "shoe", "dress", "jacket", "apparel"]],
    ["home", ["home", "furniture", "decor", "storage", "cleaning"]],
    ["kitchen", ["kitchen", "cook", "coffee", "blender", "mixer", "utensil", "pan"]],
    ["electronics", ["electronic", "gadget", "phone", "tablet", "laptop", "computer", "camera", "headphone", "speaker", "charger", "watch", "smart home"]],
  ];

  for (const [key, words] of rules) {
    if (words.some(word => text.includes(word))) {
      const match = categories.find(c => slugify(c.slug || c.name).includes(key) || slugify(c.name).includes(key));
      if (match) return match.id;
    }
  }
  return null;
}

async function loadCategories() {
  return supabase("categories?select=id,name,slug&is_active=eq.true");
}

async function fetchProducts(keyword) {
  const query = `query {
    shoppingProducts(
      companyId: "${CJ_CID}"
      keywords: ["${keyword.replace(/"/g, "\\\"")}"]
      partnerStatus: JOINED
      offset: 0
      limit: 60
      includeDeletedProducts: false
    ) {
      totalCount
      count
      resultList {
        id
        adId
        advertiserId
        advertiserName
        brand
        title
        description
        imageLink
        additionalImageLink
        link
        price { amount currency }
        salePrice { amount currency }
        effectiveDerivedPrice { amount currency }
        discountPercentage
        productType
        googleProductCategory { id name }
        availability
        isDeleted
        lastUpdated
        targetCountry
        serviceableAreas
        linkCode(pid: "${CJ_PID}") { clickUrl imageUrl }
      }
    }
  }`;
  const data = await cj(query);
  return data.shoppingProducts?.resultList || [];
}

async function upsertProducts(products, categories) {
  const unique = new Map(products.map(p => [String(p.id), p]));
  const rows = [];

  for (const p of unique.values()) {
    const amount = p.effectiveDerivedPrice?.amount ?? p.salePrice?.amount ?? p.price?.amount;
    const currency = p.effectiveDerivedPrice?.currency ?? p.salePrice?.currency ?? p.price?.currency ?? "USD";
    const price = Number(amount);
    if (!p.title || !Number.isFinite(price) || price < 0) continue;

    const affiliateUrl = p.linkCode?.clickUrl || p.link || null;
    const categoryId = pickCategory(p, categories);
    const tags = [
      ...(p.productType || []),
      p.brand,
      p.advertiserName,
      p.googleProductCategory?.name,
      p.targetCountry,
    ].filter(Boolean).map(String).slice(0, 20);

    rows.push({
      title: String(p.title).trim(),
      slug: `cj-${slugify(p.id)}`,
      short_description: String(p.description || "").replace(/\\s+/g, " ").slice(0, 220) || null,
      description: p.description || null,
      price,
      original_price: p.price?.amount != null ? Number(p.price.amount) : null,
      currency: String(currency).toUpperCase(),
      rating: 0,
      review_count: 0,
      image_url: p.linkCode?.imageUrl || p.imageLink || p.additionalImageLink?.[0] || null,
      affiliate_url: affiliateUrl,
      brand: p.brand || p.advertiserName || null,
      category_id: categoryId,
      tags,
      key_features: (p.productType || []).slice(0, 8),
      is_featured: false,
      is_deal: Boolean(p.salePrice || (p.discountPercentage && p.discountPercentage > 0)),
      is_active: !p.isDeleted && String(p.availability || "IN_STOCK") !== "OUT_OF_STOCK",
      is_sample: false,
    });
  }

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    await supabase("products?on_conflict=slug", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });
  }
  return rows.length;
}

const categories = await loadCategories();
let all = [];
for (const keyword of keywords) {
  console.log(`CJ sync: ${keyword}`);
  const products = await fetchProducts(keyword);
  console.log(`  received ${products.length}`);
  all.push(...products);
}

const imported = await upsertProducts(all, categories);
console.log(`CJ sync complete: ${imported} products processed from ${new Set(all.map(p => p.id)).size} unique CJ products.`);
