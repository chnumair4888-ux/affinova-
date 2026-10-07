import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {ProductPage,GuidePage} from "./DetailPages";
import "./index.css";

function Root(){
 const path=location.pathname;
 if(path.startsWith("/product/")) return <ProductPage slug={decodeURIComponent(path.slice(9))}/>;
 if(path.startsWith("/guide/")) return <GuidePage slug={decodeURIComponent(path.slice(7))}/>;
 return <App/>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);