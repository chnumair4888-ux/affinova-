const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const introspection=`
query {
  shopping: __type(name: "ShoppingProducts") {
    fields {
      name
      type { kind name ofType { kind name ofType { kind name } } }
    }
  }
  resultList: __type(name: "ShoppingProductResult") {
    fields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  item: __type(name: "ShoppingProductItem") {
    fields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
  result: __type(name: "Product") {
    fields { name type { kind name ofType { kind name ofType { kind name } } } }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query:introspection})});
const raw=await res.text();
console.log("CJ Product Feed types HTTP:",res.status);
console.log(raw.slice(0,16000));
console.log("CJ Product Feed type check complete.");