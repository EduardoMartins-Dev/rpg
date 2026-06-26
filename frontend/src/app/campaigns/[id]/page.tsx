"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import {
  api, type AskResponse, type Campaign, type Character, type Member,
} from "@/lib/api";

export default function CampaignDetailPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charName, setCharName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCampaign(await api.get<Campaign>(`/campaigns/${id}`));
      setMembers(await api.get<Member[]>(`/campaigns/${id}/members`));
      setCharacters(await api.get<Character[]>(`/campaigns/${id}/characters`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao carregar campanha");
    }
  }, [id]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const isMaster = campaign?.role === "MASTER";

  async function regenInvite() {
    const r = await api.post<{ inviteCode: string }>(`/campaigns/${id}/invite`);
    setCampaign((c) => (c ? { ...c, inviteCode: r.inviteCode } : c));
  }

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post<Character>(`/campaigns/${id}/characters`, {
        name: charName,
        sheetData: { type: "VAMPIRO", attributes: {}, skills: {} },
      });
      setCharName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao criar ficha");
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setAsking(true);
    setAnswer(null);
    try {
      setAnswer(await api.post<AskResponse>(`/campaigns/${id}/ai/ask`, { question }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro na IA");
    } finally {
      setAsking(false);
    }
  }

  if (!user) return <p className="muted">Carregando…</p>;
  if (!campaign) return <p className="error" data-testid="campaign-error">{error ?? "Carregando…"}</p>;

  return (
    <div data-testid="campaign-detail">
      <p><Link href="/campaigns">← Campanhas</Link></p>
      <h1>{campaign.name}</h1>
      <p>
        Seu papel: <span className="badge" data-testid="my-role">{campaign.role}</span>
      </p>

      {isMaster && (
        <div className="panel" data-testid="master-panel">
          <h2>Convite (Mestre)</h2>
          <p>
            Código: <code data-testid="invite-code">{campaign.inviteCode}</code>{" "}
            <button className="secondary" data-testid="invite-regen" onClick={regenInvite}>Gerar novo</button>
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Membros</h2>
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th></tr></thead>
          <tbody data-testid="member-list">
            {members.map((m) => (
              <tr key={m.userId} data-testid="member-row">
                <td>{m.displayName}</td>
                <td className="muted">{m.email}</td>
                <td><span className="badge">{m.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Fichas {isMaster ? "(todas — você é Mestre)" : "(suas)"}</h2>
        <form onSubmit={createCharacter} className="row">
          <input data-testid="char-name" value={charName} placeholder="nome do personagem"
            onChange={(e) => setCharName(e.target.value)} />
          <button type="submit" data-testid="char-create" style={{ flex: "0 0 auto" }}>Nova ficha</button>
        </form>
        <table style={{ marginTop: ".6rem" }}>
          <thead><tr><th>Personagem</th><th></th></tr></thead>
          <tbody data-testid="character-list">
            {characters.map((c) => (
              <tr key={c.id} data-testid="character-row">
                <td>{c.name}</td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/campaigns/${id}/characters/${c.id}`}
                    data-testid={`character-open-${c.id}`}>Abrir ficha</Link>
                </td>
              </tr>
            ))}
            {characters.length === 0 && <tr><td colSpan={2} className="muted">Nenhuma ficha.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>IA do sistema</h2>
        <form onSubmit={ask} className="row">
          <input data-testid="ai-question" value={question} placeholder="Pergunte sobre o sistema…"
            onChange={(e) => setQuestion(e.target.value)} />
          <button type="submit" data-testid="ai-ask" disabled={asking || !question}
            style={{ flex: "0 0 auto" }}>{asking ? "Perguntando…" : "Perguntar"}</button>
        </form>
        {answer && (
          <div style={{ marginTop: ".8rem" }} data-testid="ai-answer">
            <p>{answer.answer}</p>
            <p className="muted" style={{ fontSize: ".8rem" }}>
              {answer.grounded ? `${answer.sources.length} trecho(s) do sistema` : "sem material indexado"}
            </p>
          </div>
        )}
      </div>

      {error && <p className="error" data-testid="detail-error">{error}</p>}
    </div>
  );
}
