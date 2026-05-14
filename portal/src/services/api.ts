const BASE_URL = import.meta.env.VITE_API_URL as string;

export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
