const sensitive = /password|secret|token|cookie|authorization|fileBase64/i;
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        sensitive.test(k) ? "[REDACTED]" : redactSecrets(v),
      ]),
    );
  return value;
}
export function log(event: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      ...(redactSecrets(event) as object),
    }),
  );
}
