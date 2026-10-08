const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const query=`
query {
  __type(name: "ShoppingProducts") {
    fields {
      name
      type { kind name ofType { kind name ofType { kind name } } }
    }
  }
  __type(name: "ShoppingProduct") {
    fields {
      name
      type { kind name ofType { kind name ofType { kind name } } }
    }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query})});
const raw=await res.text();
console.log("CJ Product Feed schema HTTP:",res.status);
console.log(raw.slice(0,12000));
console.log("CJ Product Feed schema check complete.");