export function logError(context: string, error: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
  console.error(JSON.stringify(entry));
}

export function logWarn(context: string, message: string) {
  console.warn(JSON.stringify({ ts: new Date().toISOString(), context, message }));
}
