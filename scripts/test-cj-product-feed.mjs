const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const query=`
query {
  linkCodeType: __type(name: "LinkCode") {
    fields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  amountType: __type(name: "AmountWithCurrency") {
    fields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  shoppingProducts(
    companyId: "435457"
    keywords: ["Abelssoft"]
    partnerStatus: JOINED
    offset: 0
    limit: 5
    includeDeletedProducts: false
  ) {
    totalCount
    count
    limit
    resultList {
      ... on Shopping {
        id
        title
        description
        imageLink
        link
        price { amount currency }
        advertiserId
        advertiserName
        brand
        joinedStatus
        targetCountry
        availability
      }
    }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query})});
const raw=await res.text();
console.log("CJ Product Feed query HTTP:",res.status);
console.log(raw.slice(0,30000));
console.log("CJ Product Feed query check complete.");