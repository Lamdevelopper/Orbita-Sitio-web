"use client";
import { useState } from "react";
import { track } from "./Analytics";
import { Button } from "./ui/button";
export function ShareButton({title}:{title:string}){
  const [feedback,setFeedback]=useState<string|null>(null);
  async function share(){
    track("share_clicked");
    try{
      if(navigator.share){await navigator.share({title,url:location.href});return;}
      await navigator.clipboard.writeText(location.href);
      track("link_copied");
      setFeedback("Enlace copiado al portapapeles.");
    }catch{
      setFeedback("No se pudo compartir; copia la dirección desde la barra del navegador.");
    }
  }
  return <><Button variant="outline" size="lg" onClick={share}>Compartir artículo <span aria-hidden="true">↗</span></Button>{feedback&&<small className="share-feedback" role="status">{feedback}</small>}</>;
}
