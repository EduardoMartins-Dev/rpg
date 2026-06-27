// Thin fetch wrapper over the backend (same-origin /api via Next rewrites).
// JWT access token lives in localStorage (piloto). Role per campaign is resolved
// server-side per request — the token only carries user_id + is_admin.

const TOKEN_KEY = "portalrpg.accessToken";
const REFRESH_KEY = "portalrpg.refreshToken";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_KEY, token);
  else window.localStorage.removeItem(REFRESH_KEY);
}

// Troca o refresh token por um novo access token. Evita relogin a cada 15 min.
let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`/api/auth/refresh`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) { setToken(null); setRefreshToken(null); return false; }
        const data = await res.json();
        setToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return true;
      } catch { return false; }
      finally { refreshing = null; }
    })();
  }
  return refreshing;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init = { ...init, body: JSON.stringify(body) };
  }
  const res = await fetch(`/api${path}`, init);
  // Token expirou → tenta refresh uma vez e repete (exceto nos próprios endpoints de auth).
  if (res.status === 401 && retry && !path.startsWith("/auth/") && await tryRefresh()) {
    return request<T>(method, path, body, false);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message ?? `request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

// Multipart upload (document indexing). Kept separate — no JSON content-type.
export async function uploadFile<T>(path: string, file: File, retry = true): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api${path}`, { method: "POST", headers, body: form });
  if (res.status === 401 && retry && await tryRefresh()) {
    return uploadFile<T>(path, file, false);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `upload failed (${res.status})`);
  return data as T;
}

// --- response shapes (mirror backend DTOs) ----------------------------------

export interface User { id: string; email: string; displayName: string; isAdmin: boolean; avatarUrl?: string | null; }
export interface TokenResponse { accessToken: string; refreshToken: string; tokenType: string; expiresIn: number; }
export interface RpgSystem { id: string; name: string; slug: string; description: string | null; ruleset?: string; }
export interface SheetSchema { systemId: string; schema: SchemaShape; }
export interface SchemaShape { attributes?: string[]; skills?: string[]; [k: string]: unknown; }
export interface SystemDocument { id: string; systemId: string; fileUrl: string; status: string; }
export interface Campaign {
  id: string; name: string; description: string | null; systemId: string;
  masterId: string; inviteCode: string; role: "MASTER" | "PLAYER" | null;
  bannerUrl?: string | null; theme?: string | null;
}
export interface Member { userId: string; email: string; displayName: string; role: string; }
export interface MyCharacter {
  id: string; name: string; campaignId: string; campaignName: string;
  systemId: string | null; systemName: string;
}
export interface Character {
  id: string; campaignId: string; playerId: string; name: string;
  sheetData: Record<string, unknown>;
}
export interface AskResponse {
  campaignId: string; systemId: string; question: string; answer: string;
  grounded: boolean; sources: { content: string; systemId: string }[];
}

// --- mural da campanha (cards livres do mestre) ------------------------------
export interface BoardItem {
  id: string; campaignId: string; title: string | null; body: string | null;
  imageUrl: string | null; sortOrder: number; createdAt: string | null; updatedAt: string | null;
}

// --- V5 reference catalog (enriquece a ficha; opcional por sistema) ----------
export interface ClanView {
  id: string; label: string; description: string;
  disciplines: string[]; bane: string; compulsion: string;
}
export interface AbilityGroup { category: string; abilities: string[]; }
export interface BloodPotencyView {
  potency: number; bloodSurge: number; rouseReroll: number;
  disciplineBonus: number; baneSeverity: number; mendingRouse: number;
}
export interface PowerView { level: number; name: string; }
export interface DisciplineView { name: string; summary: string; powers: PowerView[]; }
export interface PredatorView { name: string; summary: string; disciplines: string[]; }
export interface ResonanceView { name: string; emotion: string; disciplines: string[]; }
export interface CoterieView { name: string; summary: string; }
export interface V5Catalog {
  types: string[]; clans: ClanView[]; abilities: AbilityGroup[];
  bloodPotency?: BloodPotencyView[]; disciplines?: DisciplineView[]; predatorTypes?: PredatorView[];
  advantages?: string[]; flaws?: string[]; resonances?: ResonanceView[]; coterieTypes?: CoterieView[];
}

// --- admin: gestão de usuários ----------------------------------------------
export interface AdminUser {
  id: string; email: string; displayName: string; admin: boolean; createdAt: string | null;
}
