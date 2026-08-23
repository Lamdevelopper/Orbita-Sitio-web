// Acceso tolerante a almacenamiento bloqueado del navegador.
//
// Firefox endurecido (dom.storage.enabled=false, ETP estricto o extensiones de
// privacidad) expone localStorage/sessionStorage como null o lanza al tocarlos.
// Sin este blindaje la excepción rompe la hidratación y sustituye la página por
// la pantalla de error. Todas las lecturas devuelven null y todas las escrituras
// se ignoran de forma segura cuando el almacenamiento no está disponible.

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const probeKey = "__orbita_storage_probe__";
const probes = new Map<"local" | "session", BrowserStorage | null>();

function usableStorage(kind: "localStorage" | "sessionStorage"): BrowserStorage | null {
  try {
    const store = window[kind] as BrowserStorage | null;
    if (!store) return null;
    store.setItem(probeKey, "1");
    store.removeItem(probeKey);
    return store;
  } catch {
    return null;
  }
}

function storageFor(kind: "local" | "session"): BrowserStorage | null {
  const cached = probes.get(kind);
  if (cached !== undefined) return cached;
  const resolved = usableStorage(kind === "local" ? "localStorage" : "sessionStorage");
  probes.set(kind, resolved);
  return resolved;
}

export function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return storageFor(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(kind: "local" | "session", key: string, value: string): boolean {
  try {
    storageFor(kind)?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** ID único sin depender de crypto.randomUUID (requiere contexto seguro). */
export function fallbackId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
