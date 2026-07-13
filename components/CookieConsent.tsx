"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Choice = "all" | "necessary";
const key = "orbita-cookie-consent";

export function CookieConsent(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(!localStorage.getItem(key)));const handler=()=>setOpen(true);document.querySelectorAll("[data-cookie-settings]").forEach(el=>el.addEventListener("click",handler));return()=>{cancelAnimationFrame(frame);document.querySelectorAll("[data-cookie-settings]").forEach(el=>el.removeEventListener("click",handler));};},[]);
  function save(value:Choice){localStorage.setItem(key,value);const secure=location.protocol==="https:"?"; Secure":"";document.cookie=`orbita_consent=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;setOpen(false);window.dispatchEvent(new CustomEvent("orbita:consent",{detail:value}));}
  if(!open)return null;
  return <div className="cookie-shell" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-card"><div><span className="eyebrow">TU PRIVACIDAD</span><h2 id="cookie-title">Tú decides qué medimos</h2><p>Usamos almacenamiento necesario para recordar tu elección. Con tu permiso, medimos lecturas, profundidad y artículos compartidos para mejorar la revista. No vendemos datos ni usamos publicidad conductual.</p></div><div className="cookie-actions"><Button variant="outline" size="lg" onClick={()=>save("necessary")}>Sólo necesarias</Button><Button size="lg" onClick={()=>save("all")}>Aceptar analítica</Button></div><a href="/privacidad">Ver detalles de privacidad</a></div></div>;
}
