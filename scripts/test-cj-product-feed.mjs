const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const query=`
query {
  shopping: __type(name: "ShoppingProducts") {
    fields {
      name
      type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
    }
  }
  product: __type(name: "Product") {
    kind
    possibleTypes { name kind }
  }
  productFields: __type(name: "Product") {
    fields {
      name
      type { kind name ofType { kind name ofType { kind name } } }
    }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query})});
const raw=await res.text();
console.log("CJ Product Feed result type HTTP:",res.status);
console.log(raw.slice(0,20000));
console.log("CJ Product Feed result type check complete.");