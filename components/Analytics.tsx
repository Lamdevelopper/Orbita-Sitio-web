"use client";
import { useEffect } from "react";
import { readStorage, writeStorage, fallbackId } from "../lib/safe-storage";

// Sin almacenamiento persistente se usan IDs efímeros por carga de página: la
// medición degrada (sin continuidad entre visitas) pero nunca lanza.
let ephemeralAnonymousId = "";
function persistentId(){
  const stored=readStorage("local","orbita-anonymous-id");
  if(stored)return stored;
  if(!ephemeralAnonymousId)ephemeralAnonymousId=fallbackId();
  return ephemeralAnonymousId;
}
function sessionId(){
  const stored=readStorage("session","orbita-session-id");
  if(stored)return stored;
  const value=fallbackId();
  writeStorage("session","orbita-session-id",value);
  return value;
}
const readingEvents=new Set(["active_read_30_seconds","article_25_percent","article_50_percent","article_75_percent","article_90_percent"]);
function currentArticleSlug(){return document.querySelector<HTMLElement>("[data-article-slug]")?.dataset.articleSlug||null}
function consentCookieValue(){return document.cookie.split(";").map(part=>part.trim()).find(part=>part.startsWith("orbita_consent="))?.split("=")[1]??null}
export async function track(eventName:string,properties:Record<string,unknown>={}){const consent=readStorage("local","orbita-cookie-consent")??consentCookieValue();if(consent!=="all")return;const articleSlug=currentArticleSlug();if(readingEvents.has(eventName)&&!articleSlug)return;await fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({eventName,path:location.pathname,articleSlug,anonymousId:persistentId(),sessionId:sessionId(),referrer:document.referrer,properties}),keepalive:true}).catch(()=>{});}
export function Analytics(){useEffect(()=>{track("page_viewed");if(!currentArticleSlug())return;let active=0;const timer=setInterval(()=>{if(document.visibilityState==="visible"){active+=5;if(active===30)track("active_read_30_seconds")}},5000);const sent=new Set<number>();const scroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(max<=0)return;const pct=Math.round(scrollY/max*100);[25,50,75,90].forEach(n=>{if(pct>=n&&!sent.has(n)){sent.add(n);track(`article_${n}_percent`)}})};addEventListener("scroll",scroll,{passive:true});return()=>{clearInterval(timer);removeEventListener("scroll",scroll)}},[]);return null}
