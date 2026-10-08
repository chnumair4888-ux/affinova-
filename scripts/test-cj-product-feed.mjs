const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://advertiser-lookup.api.cj.com/v2/advertiser-lookup";
if (!TOKEN) throw new Error("Missing CJ_API_TOKEN secret.");

const params = new URLSearchParams({
  "requestor-cid": process.env.CJ_CID || "8093374",
  "advertiser-name": "Abelssoft",
  "records-per-page": "20",
  "page-number": "1"
});

const res = await fetch(`${endpoint}?${params.toString()}`, {
  headers: { Authorization: "Bearer " + TOKEN, Accept: "application/xml, text/xml" }
});
const raw = await res.text();
console.log("CJ advertiser lookup HTTP:", res.status);
if (!res.ok) {
  console.log(raw.slice(0, 5000));
  process.exit(1);
}
console.log(raw.slice(0, 15000));
console.log("CJ advertiser lookup check complete.");
