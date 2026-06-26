package com.portalrpg.rules;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.portalrpg.rules.V5Catalog.AbilityCategory;
import com.portalrpg.rules.V5Catalog.BloodPotencyTier;
import com.portalrpg.rules.V5Catalog.Clan;
import com.portalrpg.rules.V5Catalog.ClanInfo;
import com.portalrpg.rules.V5Engine.RollResult;

/**
 * Catálogos V5 (apêndice 13). Cobre E2E-SHEET-12 (clãs núcleo), -15 (clãs Companion),
 * -16 (27 habilidades), -17 (errata Potência de Sangue + Compulsão em Crítico).
 */
class V5CatalogTest {

    /** E2E-SHEET-12 — clã auto-popula disciplinas+maldição+compulsão (Brujah e Nosferatu). */
    @Test
    void coreClansAutoPopulate() {
        ClanInfo brujah = V5Catalog.clan(Clan.BRUJAH);
        assertThat(brujah.disciplines()).containsExactly("Celeridade", "Potência", "Presença");
        assertThat(brujah.compulsion()).isEqualTo("Rebelião");
        assertThat(brujah.bane()).isNotBlank();

        ClanInfo nosferatu = V5Catalog.clan(Clan.NOSFERATU);
        assertThat(nosferatu.disciplines()).containsExactly("Animalismo", "Ofuscação", "Potência");
        assertThat(nosferatu.compulsion()).isEqualTo("Criptofilia");
        assertThat(nosferatu.bane()).contains("Aparência");
    }

    /** E2E-SHEET-15 — clãs do Companion (Ravnos/Salubri/Tzimisce) auto-populam (§13.2). */
    @Test
    void companionClansAutoPopulate() {
        assertThat(V5Catalog.clan(Clan.RAVNOS).disciplines())
                .containsExactly("Animalismo", "Ofuscação", "Presença");
        assertThat(V5Catalog.clan(Clan.RAVNOS).compulsion()).isEqualTo("Destino Tentador");

        assertThat(V5Catalog.clan(Clan.SALUBRI).disciplines())
                .containsExactly("Auspícios", "Dominação", "Fortitude");
        assertThat(V5Catalog.clan(Clan.SALUBRI).compulsion()).isEqualTo("Empatia Afetiva");

        assertThat(V5Catalog.clan(Clan.TZIMISCE).disciplines())
                .containsExactly("Animalismo", "Dominação", "Proteanismo");
        assertThat(V5Catalog.clan(Clan.TZIMISCE).compulsion()).isEqualTo("Cobiça");
    }

    /** E2E-SHEET-16 — 27 habilidades em Físicas/Sociais/Mentais (9 cada). */
    @Test
    void abilityCatalog() {
        assertThat(V5Catalog.abilities()).hasSize(27);
        assertThat(V5Catalog.abilities(AbilityCategory.FISICAS)).hasSize(9);
        assertThat(V5Catalog.abilities(AbilityCategory.SOCIAIS)).hasSize(9);
        assertThat(V5Catalog.abilities(AbilityCategory.MENTAIS)).hasSize(9);
        assertThat(V5Catalog.abilities(AbilityCategory.FISICAS))
                .extracting(V5Catalog.Ability::name)
                .contains("Armas Brancas", "Briga", "Atletismo");
    }

    /** E2E-SHEET-17 — errata: tabela de Potência de Sangue 0–6 (Surto/Gravidade +1). */
    @Test
    void bloodPotencyErrataTable() {
        BloodPotencyTier t0 = V5Catalog.bloodPotency(0);
        assertThat(t0.bloodSurge()).isEqualTo(1);
        assertThat(t0.baneSeverity()).isZero();

        BloodPotencyTier t1 = V5Catalog.bloodPotency(1);
        assertThat(t1.bloodSurge()).isEqualTo(2);
        assertThat(t1.baneSeverity()).isEqualTo(2); // errata +1

        BloodPotencyTier t6 = V5Catalog.bloodPotency(6);
        assertThat(t6.bloodSurge()).isEqualTo(4);
        assertThat(t6.baneSeverity()).isEqualTo(4);
        assertThat(t6.disciplineBonus()).isEqualTo(3);
    }

    /** E2E-SHEET-17 (errata) — Compulsão dispara em Falha Bestial OU Crítico Sangrento. */
    @Test
    void compulsionTriggersOnBestialOrBloodyCritical() {
        RollResult bestial = V5Engine.evaluate(List.of(3), List.of(1), 2);
        assertThat(V5Engine.compulsionTriggered(bestial)).isTrue();

        RollResult bloody = V5Engine.evaluate(List.of(10), List.of(10), 1);
        assertThat(V5Engine.compulsionTriggered(bloody)).isTrue();

        RollResult plainWin = V5Engine.evaluate(List.of(7, 8), List.of(7), 1);
        assertThat(V5Engine.compulsionTriggered(plainWin)).isFalse();
    }
}
