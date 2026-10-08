const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const query=`
query {
  shoppingProducts(
    companyId: "435457"
    keywords: ["Abelssoft","Ascora","software","security"]
    partnerStatus: JOINED
    offset: 0
    limit: 20
    includeDeletedProducts: false
  ) {
    totalCount
    products {
      id
      title
      description
      imageLink
      link
      price
      advertiser
      brand
      productType
      availability
    }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query})});
const raw=await res.text();
console.log("CJ Product Feed HTTP:",res.status);
console.log(raw.slice(0,12000));
