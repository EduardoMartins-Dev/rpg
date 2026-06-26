"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

/** Redirects to /login if unauthenticated (and to /campaigns if adminOnly and not admin). */
export function useRequireUser(adminOnly = false) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (adminOnly && !user.isAdmin) router.replace("/campaigns");
  }, [user, loading, adminOnly, router]);

  return { user, loading };
}
