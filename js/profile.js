// Identité de synchronisation : empreinte (SHA-256) du prénom + code secret. Le code n'est jamais stocké ni envoyé en clair.
export async function makeProfileId(name, code) {
  const data = new TextEncoder().encode(`ccm2|${String(name).trim().toLowerCase()}|${code}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
