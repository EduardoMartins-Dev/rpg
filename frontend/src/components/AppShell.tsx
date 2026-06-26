"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/api";

type NavKey = "campaigns" | "admin" | "settings";

/** Casca autenticada: sidebar fixa (navegação + perfil + sair) + área de conteúdo. */
export function AppShell({ user, active, children }: {
  user: User;
  active: NavKey;
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();

  function doLogout() {
    logout();
    router.push("/");
  }

  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><Logo small /></div>

        <Link href="/campaigns" data-testid="nav-campaigns"
          className={`side-link${active === "campaigns" ? " on" : ""}`}>
          <span className="ic">📚</span>Campanhas
        </Link>
        {user.isAdmin && (
          <Link href="/admin" data-testid="nav-admin"
            className={`side-link${active === "admin" ? " on" : ""}`}>
            <span className="ic">⬡</span>Admin
          </Link>
        )}
        <Link href="/settings" data-testid="nav-settings"
          className={`side-link${active === "settings" ? " on" : ""}`}>
          <span className="ic">⚙</span>Configurações
        </Link>

        <div style={{ flex: 1 }} />

        <div className="side-foot">
          <span className="avatar"
            style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}>
            {user.avatarUrl ? "" : initials}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div data-testid="nav-user" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>
          <button className="ghost" data-testid="logout" title="Sair" onClick={doLogout}
            style={{ padding: "6px 8px", fontSize: 16 }}>⏻</button>
        </div>
      </aside>

      <div className="app-main">{children}</div>
    </div>
  );
}
