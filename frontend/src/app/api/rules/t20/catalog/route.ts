import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import * as T20 from "@/server/rules/t20/catalog";

/** Catálogo do Tormenta 20 para o frontend montar a ficha (atributos, perícias, classes,
 * raças). Cresce conforme o catálogo é preenchido. Só exige estar logado. */
export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAuth(req);
    return NextResponse.json({
      attributes: T20.ATTRIBUTES,
      skills: T20.SKILLS,
      classes: T20.CLASSES,
      races: T20.RACES,
      origins: T20.ORIGINS,
      deities: T20.DEITIES,
      powers: T20.POWERS,
      spells: T20.SPELLS,
      weapons: T20.WEAPONS,
      weaponUpgrades: T20.WEAPON_UPGRADES,
    });
  });
}
