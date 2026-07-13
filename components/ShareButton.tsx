"use client";
import { track } from "./Analytics";
import { Button } from "./ui/button";
export function ShareButton({title}:{title:string}){async function share(){track("share_clicked");if(navigator.share){await navigator.share({title,url:location.href}).catch(()=>{})}else{await navigator.clipboard.writeText(location.href);track("link_copied")}}return <Button variant="outline" size="lg" onClick={share}>Compartir artículo ↗</Button>}
