"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/api";

type NavKey = "campaigns" | "characters" | "admin" | "settings";

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

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><Logo small /></div>

        <Link href="/campaigns" data-testid="nav-campaigns"
          className={`side-link${active === "campaigns" ? " on" : ""}`}>
          <span className="ic">📚</span><span className="side-label">Campanhas</span>
        </Link>
        <Link href="/characters" data-testid="nav-characters"
          className={`side-link${active === "characters" ? " on" : ""}`}>
          <span className="ic">🎭</span><span className="side-label">Personagens</span>
        </Link>
        {user.isAdmin && (
          <Link href="/admin" data-testid="nav-admin"
            className={`side-link${active === "admin" ? " on" : ""}`}>
            <span className="ic">⬡</span><span className="side-label">Admin</span>
          </Link>
        )}
        <Link href="/settings" data-testid="nav-settings"
          className={`side-link${active === "settings" ? " on" : ""}`}>
          <span className="ic">⚙</span><span className="side-label">Configurações</span>
        </Link>

        <div className="side-spacer" />

        <div className="side-foot">
          <Avatar src={user.avatarUrl} name={user.displayName || user.email} />
          <div className="side-user-text" style={{ minWidth: 0, flex: 1 }}>
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
