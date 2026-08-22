"use client";
import { FormEvent, useState } from "react";
import { Button } from "./ui/button";

type FormState = "idle" | "saving" | "pending" | "rate-limited" | "error";

export function NewsletterForm() {
  const [state, setState] = useState<FormState>("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: fd.get("email") }),
    });

    if (res.ok) {
      // The public API may send a confirmation link; keep the UI in a pending
      // state so a stored address is not treated as subscribed before opt-in.
      setState("pending");
    } else if (res.status === 429) {
      setState("rate-limited");
    } else {
      setState("error");
    }
  }

  // Double opt-in copy keeps the launch promise while asking for confirmation.
  if (state === "pending") {
    return (
      <p className="newsletter-success" role="status">
        Revisa tu correo para confirmar la suscripción. <strong>Próximamente</strong> te
        avisaremos cuando lancemos la newsletter.
      </p>
    );
  }

  // Mensaje cuando la IP excede el rate limit (3 envíos / 15 min)
  if (state === "rate-limited") {
    return (
      <p className="newsletter-rate-limited" role="status">
        Registraste varios correos seguidos. Espera unos minutos e intenta de
        nuevo.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className="sr-only" htmlFor="email">Correo electrónico</label>
      <input
        name="email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.mx"
        required
        aria-describedby={state === "error" ? "newsletter-error" : undefined}
      />
      <Button type="submit" size="lg" disabled={state === "saving"}>
        {state === "saving" ? "Guardando…" : <><span>Quiero recibirla</span> <span aria-hidden="true">→</span></>}
      </Button>
      {state === "error" && (
        <small id="newsletter-error" role="alert">No pudimos guardar tu correo. Intenta otra vez.</small>
      )}
    </form>
  );
}
