import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {ProductPage,GuidePage} from "./DetailPages";
import {AboutPage,PrivacyPage,TermsPage,AffiliatePage,ContactPage,NotFoundPage} from "./LegalPages";
import "./index.css";

function Root(){
 const path=location.pathname;
 if(path==="/about") return <AboutPage/>;
 if(path==="/privacy") return <PrivacyPage/>;
 if(path==="/terms") return <TermsPage/>;
 if(path==="/affiliate-disclosure") return <AffiliatePage/>;
 if(path==="/contact") return <ContactPage/>;
 if(path.startsWith("/product/")) return <ProductPage slug={decodeURIComponent(path.slice(9))}/>;
 if(path.startsWith("/guide/")) return <GuidePage slug={decodeURIComponent(path.slice(7))}/>;
 if(path==="/admin"||path.startsWith("/admin/")) return <App/>;
 if(path!=="/"&&path!=="") return <NotFoundPage/>;
 return <App/>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);
