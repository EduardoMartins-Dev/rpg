"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="nav" data-testid="nav">
      <Link href="/" style={{ fontWeight: 700 }}>🩸 Portal de RPG</Link>
      {user && <Link href="/campaigns" data-testid="nav-campaigns">Campanhas</Link>}
      {user?.isAdmin && <Link href="/admin" data-testid="nav-admin">Admin</Link>}
      <span className="spacer" />
      {user ? (
        <>
          <span className="muted" data-testid="nav-user">{user.displayName}</span>
          {user.isAdmin && <span className="badge">admin</span>}
          <button
            className="secondary"
            data-testid="logout"
            onClick={() => { logout(); router.push("/login"); }}
          >
            Sair
          </button>
        </>
      ) : (
        <>
          <Link href="/login" data-testid="nav-login">Entrar</Link>
          <Link href="/register" data-testid="nav-register">Criar conta</Link>
        </>
      )}
    </nav>
  );
}
