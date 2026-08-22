"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

type Choice = "all" | "necessary";
const key = "orbita-cookie-consent";

export function CookieConsent(){
  const [open,setOpen]=useState(false);
  const dialogRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(!localStorage.getItem(key)));const handler=()=>setOpen(true);document.querySelectorAll("[data-cookie-settings]").forEach(el=>el.addEventListener("click",handler));return()=>{cancelAnimationFrame(frame);document.querySelectorAll("[data-cookie-settings]").forEach(el=>el.removeEventListener("click",handler));};},[]);
  // Gestión de foco del diálogo: moverlo al abrir, atrapar Tab dentro,
  // cerrar con Escape y devolver el foco al elemento que lo tenía antes.
  useEffect(()=>{
    if(!open)return;
    const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
    dialogRef.current?.focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key==="Escape"){setOpen(false);return;}
      if(event.key!=="Tab"||!dialogRef.current)return;
      const focusables=dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]");
      if(!focusables.length)return;
      const first=focusables[0];
      const last=focusables[focusables.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",onKeyDown);
    return()=>{document.removeEventListener("keydown",onKeyDown);previouslyFocused?.focus();};
  },[open]);
  function save(value:Choice){localStorage.setItem(key,value);const secure=location.protocol==="https:"?"; Secure":"";document.cookie=`orbita_consent=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;setOpen(false);window.dispatchEvent(new CustomEvent("orbita:consent",{detail:value}));}
  if(!open)return null;
  return <div className="cookie-shell" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-card" ref={dialogRef} tabIndex={-1}><div><span className="eyebrow">TU PRIVACIDAD</span><h2 id="cookie-title">Tú decides qué medimos</h2><p>Usamos almacenamiento necesario para recordar tu elección. Con tu permiso, medimos lecturas, profundidad y artículos compartidos para mejorar la revista. No vendemos datos ni usamos publicidad conductual.</p></div><div className="cookie-actions"><Button variant="outline" size="lg" onClick={()=>save("necessary")}>Sólo necesarias</Button><Button size="lg" onClick={()=>save("all")}>Aceptar analítica</Button></div><a href="/privacidad">Ver detalles de privacidad</a></div></div>;
}
