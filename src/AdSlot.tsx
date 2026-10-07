import {useEffect,useRef,useState} from "react";

type AdSlotProps={slot?:string;className?:string};

let adsenseLoader:Promise<void>|null=null;

function loadAdSense(client:string){
  if(typeof window==="undefined")return Promise.resolve();
  if((window as any).adsbygoogle)return Promise.resolve();
  if(adsenseLoader)return adsenseLoader;
  adsenseLoader=new Promise<void>((resolve,reject)=>{
    const existing=document.querySelector('script[data-affinova-adsense="true"]') as HTMLScriptElement|null;
    if(existing){existing.addEventListener("load",()=>resolve(),{once:true});existing.addEventListener("error",()=>reject(),{once:true});return}
    const script=document.createElement("script");
    script.async=true;
    script.crossOrigin="anonymous";
    script.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(client);
    script.dataset.affinovaAdsense="true";
    script.onload=()=>resolve();
    script.onerror=()=>reject();
    document.head.appendChild(script);
  });
  return adsenseLoader;
}

export default function AdSlot({slot,className=""}:AdSlotProps){
  const client=import.meta.env.VITE_ADSENSE_CLIENT as string|undefined;
  const ref=useRef<HTMLElement|null>(null);
  const [filled,setFilled]=useState(false);

  useEffect(()=>{
    if(!client||!slot)return;
    let cancelled=false;
    const node=ref.current;
    const observer=node?new MutationObserver(()=>{
      const status=node.getAttribute("data-ad-status");
      if(status==="filled"){setFilled(true);observer?.disconnect()}
      if(status==="unfilled"){setFilled(false);observer?.disconnect()}
    }):null;
    if(node)observer?.observe(node,{attributes:true,attributeFilter:["data-ad-status"]});

    loadAdSense(client).then(()=>{
      if(cancelled)return;
      try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}
    }).catch(()=>{});

    return()=>{cancelled=true;observer?.disconnect()};
  },[client,slot]);

  if(!client||!slot)return null;
  return <ins ref={ref} className={"adsbygoogle affinova-ad "+className+(filled?" ad-ready":"")} style={{display:"block"}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>;
}
