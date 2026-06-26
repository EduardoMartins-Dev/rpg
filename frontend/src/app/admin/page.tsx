"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { api, uploadFile, type AdminUser, type RpgSystem, type SheetSchema, type SystemDocument } from "@/lib/api";

type AdminTab = "systems" | "users";

const DEFAULT_SCHEMA = JSON.stringify(
  {
    attributes: ["forca", "destreza", "vigor", "carisma", "manipulacao", "autocontrole",
      "inteligencia", "raciocinio", "determinacao"],
    skills: ["briga", "armas_brancas", "atletismo", "intimidacao", "ocultismo"],
  },
  null,
  2,
);

export default function AdminPage() {
  const { user } = useRequireUser(true);
  const [systems, setSystems] = useState<RpgSystem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [docs, setDocs] = useState<SystemDocument[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("systems");
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadSystems = useCallback(async () => {
    setSystems(await api.get<RpgSystem[]>("/systems"));
  }, []);

  const loadUsers = useCallback(async () => {
    try { setUsers(await api.get<AdminUser[]>("/admin/users")); } catch { setUsers([]); }
  }, []);

  useEffect(() => { if (user) loadSystems(); }, [user, loadSystems]);
  useEffect(() => { if (user && tab === "users") loadUsers(); }, [user, tab, loadUsers]);

  async function toggleAdmin(u: AdminUser) {
    setError(null); setMsg(null);
    try {
      await api.put(`/admin/users/${u.id}/admin`, { admin: !u.admin });
      await loadUsers();
      setMsg(`Papel de ${u.displayName} atualizado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao atualizar papel");
    }
  }

  async function deleteUser(u: AdminUser) {
    setError(null); setMsg(null);
    if (!confirm(`Excluir a conta de ${u.displayName} (${u.email})? Ação permanente.`)) return;
    try {
      await api.del(`/admin/users/${u.id}`);
      await loadUsers();
      setMsg(`Conta de ${u.displayName} excluída.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao excluir conta");
    }
  }

  async function createSystem(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMsg(null);
    try {
      const s = await api.post<RpgSystem>("/systems", { name, slug, description: "" });
      setName(""); setSlug("");
      await loadSystems();
      setMsg(`Sistema "${s.name}" criado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    }
  }

  const selectSystem = useCallback(async (id: string) => {
    setSelected(id); setError(null); setMsg(null);
    try {
      const sc = await api.get<SheetSchema>(`/systems/${id}/sheet-schema`);
      setSchemaText(JSON.stringify(sc.schema, null, 2));
    } catch {
      setSchemaText(DEFAULT_SCHEMA);
    }
    try { setDocs(await api.get<SystemDocument[]>(`/systems/${id}/documents`)); } catch { setDocs([]); }
  }, []);

  async function saveSchema() {
    if (!selected) return;
    setError(null); setMsg(null);
    let parsed: unknown;
    try { parsed = JSON.parse(schemaText); }
    catch { setError("JSON do schema inválido"); return; }
    try {
      await api.put(`/systems/${selected}/sheet-schema`, { schema: parsed });
      setMsg("Sheet-schema salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    }
  }

  async function upload() {
    if (!selected || !file) return;
    setError(null); setMsg(null);
    try {
      await uploadFile(`/systems/${selected}/documents`, file);
      setDocs(await api.get<SystemDocument[]>(`/systems/${selected}/documents`));
      setMsg("Documento enviado e indexado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro no upload");
    }
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="admin">
      <div className="page page-wide" data-testid="admin-page">
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1>Painel de Admin</h1>
          <span className="badge" style={{ color: "var(--info)", background: "rgba(91,141,239,.14)", border: "none" }}>Área restrita</span>
        </div>
      </div>
      <p className="sub" style={{ marginTop: -18, marginBottom: 22, color: "var(--muted)" }}>Gerencie os sistemas de RPG, livros, schemas de ficha e usuários.</p>

      <div className="cam-tabs" style={{ padding: 0, marginBottom: 22 }}>
        <button className={`tab${tab === "systems" ? " on" : ""}`} data-testid="admin-tab-systems" onClick={() => setTab("systems")}>Sistemas</button>
        <button className={`tab${tab === "users" ? " on" : ""}`} data-testid="admin-tab-users" onClick={() => setTab("users")}>Usuários</button>
      </div>

      {tab === "users" && (
        <div className="panel" style={{ padding: 0 }} data-testid="admin-users">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <strong>Usuários ({users.length})</strong>
            <button className="secondary" onClick={loadUsers} style={{ padding: "6px 12px", fontSize: 13 }}>Atualizar</button>
          </div>
          <table>
            <thead><tr><th style={{ paddingLeft: 20 }}>Usuário</th><th>E-mail</th><th>Papel</th><th style={{ textAlign: "right", paddingRight: 20 }}>Ações</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid="user-row">
                  <td style={{ paddingLeft: 20 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                      <span className="avatar">{(u.displayName || u.email).slice(0, 2).toUpperCase()}</span>
                      <strong>{u.displayName}</strong>
                    </span>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td><span className={`badge ${u.admin ? "role-MASTER" : ""}`}>{u.admin ? "Admin" : "Usuário"}</span></td>
                  <td style={{ textAlign: "right", paddingRight: 20, whiteSpace: "nowrap" }}>
                    <button className="secondary" data-testid={`user-toggle-admin-${u.id}`} onClick={() => toggleAdmin(u)}
                      style={{ padding: "6px 10px", fontSize: 13, marginRight: 8 }}>
                      {u.admin ? "Rebaixar" : "Tornar admin"}
                    </button>
                    <button className="danger" data-testid={`user-delete-${u.id}`} onClick={() => deleteUser(u)}
                      style={{ padding: "6px 10px", fontSize: 13 }}>Excluir</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>Nenhum usuário.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "systems" && (<>
      <div className="metrics">
        <div className="metric"><div className="v">{systems.length}</div><div className="l">Sistemas</div></div>
        <div className="metric"><div className="v">{selected ? docs.length : "—"}</div><div className="l">Livros (sistema atual)</div></div>
        <div className="metric"><div className="v">{selected ? docs.filter((d) => d.status === "INDEXED").length : "—"}</div><div className="l">Indexados</div></div>
        <div className="metric"><div className="v mono">RAG</div><div className="l">Mestre de Regras</div></div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 18 }}>Novo sistema</h2>
        <form onSubmit={createSystem} className="row">
          <div>
            <label htmlFor="sys-name">Nome</label>
            <input id="sys-name" data-testid="system-name" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="sys-slug">Slug</label>
            <input id="sys-slug" data-testid="system-slug" value={slug}
              onChange={(e) => setSlug(e.target.value)} placeholder="vampiro-v5" />
          </div>
          <button type="submit" data-testid="system-create" style={{ flex: "0 0 auto" }}>+ Criar</button>
        </form>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead><tr><th style={{ paddingLeft: 20 }}>Sistema</th><th>Slug</th><th style={{ textAlign: "right", paddingRight: 20 }}></th></tr></thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id} data-testid={`system-row-${s.slug}`}>
                <td style={{ paddingLeft: 20 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--elev)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>⬡</span>
                    <strong>{s.name}</strong>
                  </span>
                </td>
                <td className="mono muted">{s.slug}</td>
                <td style={{ textAlign: "right", paddingRight: 20 }}>
                  <button className="secondary" data-testid={`system-manage-${s.slug}`}
                    onClick={() => selectSystem(s.id)} style={{ padding: "6px 12px", fontSize: 13 }}>Gerenciar</button>
                </td>
              </tr>
            ))}
            {systems.length === 0 && <tr><td colSpan={3} className="muted" style={{ padding: 20 }}>Nenhum sistema ainda.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="panel" data-testid="system-detail">
          <h2>Sheet-schema (template da ficha)</h2>
          <p className="muted">A ficha é renderizada dinamicamente a partir deste JSON — sem hardcode por sistema.</p>
          <textarea data-testid="schema-text" value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)} style={{ minHeight: "12rem" }} />
          <div style={{ marginTop: ".6rem" }}>
            <button data-testid="schema-save" onClick={saveSchema}>Salvar schema</button>
          </div>

          <h2 style={{ marginTop: "1.5rem" }}>Documentos (RAG)</h2>
          <div className="row">
            <input type="file" data-testid="doc-file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button data-testid="doc-upload" onClick={upload} disabled={!file} style={{ flex: "0 0 auto" }}>
              Enviar + indexar
            </button>
          </div>
          <table style={{ marginTop: ".6rem" }}>
            <thead><tr><th>Documento</th><th>Status</th></tr></thead>
            <tbody data-testid="doc-list">
              {docs.map((d) => (
                <tr key={d.id} data-testid={`doc-row`}>
                  <td className="muted" style={{ wordBreak: "break-all" }}>{d.fileUrl.split("/").pop()}</td>
                  <td><span className="badge" data-testid="doc-status">{d.status}</span></td>
                </tr>
              ))}
              {docs.length === 0 && <tr><td colSpan={2} className="muted">Sem documentos.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      </>)}

      {msg && <p className="ok-msg" data-testid="admin-msg">✓ {msg}</p>}
      {error && <p className="error" data-testid="admin-error">⚠ {error}</p>}
      </div>
    </AppShell>
  );
}
