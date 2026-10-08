const TOKEN=process.env.CJ_API_TOKEN;
const endpoint="https://ads.api.cj.com/query";
const introspection=`
query {
  __schema {
    types {
      name
      kind
    }
  }
}`;
const res=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+TOKEN,"Content-Type":"application/json"},body:JSON.stringify({query:introspection})});
const raw=await res.text();
console.log("CJ Product Feed schema HTTP:",res.status);
try {
  const json=JSON.parse(raw);
  const types=json?.data?.__schema?.types||[];
  const matches=types.filter(t=>/product|shopping|result/i.test(t.name||""));
  console.log(JSON.stringify({matchingTypes:matches},null,2));
} catch {
  console.log(raw.slice(0,16000));
}
console.log("CJ Product Feed type discovery complete.");