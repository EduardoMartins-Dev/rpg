import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import * as V5Catalog from "@/server/rules/v5/catalog";
import type { AbilityCategory } from "@/server/rules/v5/catalog";

function abilityGroup(category: AbilityCategory) {
  return { category, abilities: V5Catalog.abilities(category).map((a) => a.name) };
}

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAuth(req);

    const clans = V5Catalog.clans().map((c) => ({
      id: c.clan,
      label: c.label,
      description: c.description,
      disciplines: c.disciplines,
      bane: c.bane,
      compulsion: c.compulsion,
    }));

    const abilities = (["FISICAS", "SOCIAIS", "MENTAIS"] as const).map(abilityGroup);

    const bloodPotency = Array.from({ length: 7 }, (_, i) => V5Catalog.bloodPotency(i));

    const disciplines = V5Catalog.disciplines().map((d) => ({
      name: d.name,
      summary: d.summary,
      powers: d.powers.map((p) => ({ level: p.level, name: p.name, en: p.en, desc: p.desc })),
    }));

    const predatorTypes = V5Catalog.predatorTypes().map((pt) => ({
      name: pt.name,
      summary: pt.summary,
      disciplines: pt.disciplines,
    }));

    const resonances = V5Catalog.resonances().map((r) => ({
      name: r.name,
      emotion: r.emotion,
      disciplines: r.disciplines,
    }));

    const coterieTypes = V5Catalog.coterieTypes().map((c) => ({ name: c.name, summary: c.summary }));

    return NextResponse.json({
      types: [...V5Catalog.CHARACTER_TYPES],
      clans,
      abilities,
      bloodPotency,
      disciplines,
      predatorTypes,
      advantages: V5Catalog.advantages(),
      flaws: V5Catalog.flaws(),
      resonances,
      coterieTypes,
    });
  });
}
