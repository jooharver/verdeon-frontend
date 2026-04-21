// services/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function api(
  endpoint: string,
  options: RequestInit = {}
) {

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 👇 TAMBAHKAN "Accept": "application/json" DI SINI 👇
  const headers: Record<string, string> = {
    "Accept": "application/json", 
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Cek apakah body FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const finalHeaders = {
    ...headers,
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: finalHeaders,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || "API Error");
  }

  return data;
}