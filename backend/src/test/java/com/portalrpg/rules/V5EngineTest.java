package com.portalrpg.rules;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.portalrpg.rules.V5Engine.DicePool;
import com.portalrpg.rules.V5Engine.HealthTrack;
import com.portalrpg.rules.V5Engine.RollOutcome;
import com.portalrpg.rules.V5Engine.RollResult;
import com.portalrpg.rules.V5Engine.RouseResult;
import com.portalrpg.rules.V5Engine.TraitType;

/**
 * Motor de regras V5 — testes determinísticos contra as fixtures §9.
 * Cobre E2E-SHEET-01,03,04,05,06,07,08,09,10,11,14 (mecânica de domínio).
 */
class V5EngineTest {

    /** E2E-SHEET-01 — Vitalidade = Vigor+3; FdV = Autocontrole+Determinação (§9.1). */
    @Test
    void derivedStats() {
        assertThat(V5Engine.vitality(3)).isEqualTo(6);
        assertThat(V5Engine.willpower(3, 2)).isEqualTo(5);
    }

    /** E2E-SHEET-03 — parada aceita qualquer Atributo+Habilidade. */
    @Test
    void poolAcceptsAnyAttributePlusSkill() {
        // Inteligência 3 + Armas Brancas 2, Fome 0 → 5 dados normais
        DicePool p = V5Engine.pool(3, 2, 0);
        assertThat(p.total()).isEqualTo(5);
        assertThat(p.normal()).isEqualTo(5);
        assertThat(p.hunger()).isZero();
    }

    /** E2E-SHEET-04 — Fome 2 em parada 6 = 4 normais + 2 de Fome (tamanho fixo). */
    @Test
    void hungerSubstitutesPreservingSize() {
        DicePool p = V5Engine.pool(3, 3, 2);
        assertThat(p.total()).isEqualTo(6);
        assertThat(p.normal()).isEqualTo(4);
        assertThat(p.hunger()).isEqualTo(2);
    }

    /** E2E-SHEET-07 — par de 10 = 4 sucessos. */
    @Test
    void pairOfTensCountsFour() {
        RollResult r = V5Engine.evaluate(List.of(10, 10, 4), List.of(), 1);
        assertThat(r.successes()).isEqualTo(4);
        assertThat(r.outcome()).isEqualTo(RollOutcome.CRITICAL_WIN);
        assertThat(r.criticalWin()).isTrue();
        assertThat(r.bloodyCritical()).isFalse(); // nenhum 10 de Fome
    }

    /** E2E-SHEET-06 — Crítico Sangrento: par de 10 com ≥1 em dado de Fome. */
    @Test
    void bloodyCriticalWithHungerTen() {
        RollResult r = V5Engine.evaluate(List.of(10), List.of(10), 1);
        assertThat(r.successes()).isEqualTo(4);
        assertThat(r.criticalWin()).isTrue();
        assertThat(r.bloodyCritical()).isTrue();
    }

    /** E2E-SHEET-05 — Falha Bestial (falha + Fome=1); não dispara se sucessos bastavam. */
    @Test
    void bestialFailureOnlyOnFailure() {
        // falha: dificuldade 2, só 1 sucesso + um dado de Fome = 1
        RollResult fail = V5Engine.evaluate(List.of(7, 3), List.of(1), 2);
        assertThat(fail.successes()).isEqualTo(1);
        assertThat(fail.bestialFailure()).isTrue();
        assertThat(fail.outcome()).isEqualTo(RollOutcome.BESTIAL_FAILURE);

        // sucessos bastavam: dificuldade 1, mesmo com Fome=1 → NÃO é falha bestial
        RollResult win = V5Engine.evaluate(List.of(7, 8), List.of(1), 1);
        assertThat(win.bestialFailure()).isFalse();
        assertThat(win.outcome()).isEqualTo(RollOutcome.WIN);
    }

    /** E2E-SHEET-08 — FdV rerrola até 3 normais; bloqueia rerrolar dado de Fome. */
    @Test
    void willpowerRerollNormalsOnlyMaxThree() {
        // dice: idx0..2 normais (falham), idx3 Fome
        RollResult r = V5Engine.evaluate(List.of(2, 3, 4), List.of(5), 2);
        assertThat(r.successes()).isZero();

        // rerrola 3 normais para valores que viram sucesso
        RollResult re = V5Engine.willpowerReroll(r, List.of(0, 1, 2), List.of(8, 9, 10));
        assertThat(re.successes()).isEqualTo(3);

        // bloqueia rerrolar o dado de Fome (idx 3)
        assertThatThrownBy(() -> V5Engine.willpowerReroll(r, List.of(3), List.of(9)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Hunger");

        // bloqueia rerrolar mais de 3 dados
        assertThatThrownBy(() -> V5Engine.willpowerReroll(r, List.of(0, 1, 2, 3), List.of(7, 7, 7, 7)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at most 3");
    }

    /** E2E-SHEET-09 — Rouse <6 sobe Fome, 6+ mantém (§9.3). */
    @Test
    void rouseCheck() {
        RouseResult up = V5Engine.rouse(1, 4);
        assertThat(up.increased()).isTrue();
        assertThat(up.hunger()).isEqualTo(2);

        RouseResult keep = V5Engine.rouse(1, 7);
        assertThat(keep.increased()).isFalse();
        assertThat(keep.hunger()).isEqualTo(1);

        // cap em 5
        assertThat(V5Engine.rouse(5, 1).hunger()).isEqualTo(5);
    }

    /** E2E-SHEET-10 — superficial ÷2 (cima); agravado não reduz; trilha cheia → Debilitado. */
    @Test
    void damageRules() {
        HealthTrack t = new HealthTrack(6, 0, 0);

        // superficial vampírico: 5 de dano → ceil(5/2)=3 marcados
        t = V5Engine.applySuperficialVampiric(t, 5);
        assertThat(t.superficial()).isEqualTo(3);
        assertThat(t.impaired()).isFalse();

        // agravado não reduz: +3 agravado → trilha 3+3=6 cheia → Debilitado
        t = V5Engine.applyAggravated(t, 3);
        assertThat(t.aggravated()).isEqualTo(3);
        assertThat(t.totalMarked()).isEqualTo(6);
        assertThat(t.impaired()).isTrue();
        assertThat(t.penalty()).isEqualTo(-2);
    }

    /** E2E-SHEET-11 — XP (§9.5): atributo 2→3 = 15; disc. clã 1→2 = 10; fora do clã 1→2 = 14. */
    @Test
    void xpCosts() {
        assertThat(V5Engine.xpCostRaise(TraitType.ATTRIBUTE, 2)).isEqualTo(15);
        assertThat(V5Engine.xpCostRaise(TraitType.CLAN_DISCIPLINE, 1)).isEqualTo(10);
        assertThat(V5Engine.xpCostRaise(TraitType.OTHER_DISCIPLINE, 1)).isEqualTo(14);
        assertThat(V5Engine.xpCostRaise(TraitType.CAITIFF_DISCIPLINE, 1)).isEqualTo(12);
        assertThat(V5Engine.xpCost(TraitType.SPECIALIZATION, 1)).isEqualTo(3);
    }

    /** E2E-SHEET-14 — point-buy rejeita distribuição fora dos padrões (§9.7). */
    @Test
    void pointBuyAttributeSpread() {
        // válido: um 4, três 3, quatro 2, um 1
        assertThat(V5Engine.isValidAttributeSpread(List.of(4, 3, 3, 3, 2, 2, 2, 2, 1))).isTrue();
        // ordem diferente, mesmo multiconjunto → válido
        assertThat(V5Engine.isValidAttributeSpread(List.of(1, 2, 2, 3, 4, 3, 2, 3, 2))).isTrue();
        // fora do padrão (dois 4) → inválido
        assertThat(V5Engine.isValidAttributeSpread(List.of(4, 4, 3, 3, 2, 2, 2, 2, 1))).isFalse();
        // contagem errada → inválido
        assertThat(V5Engine.isValidAttributeSpread(List.of(4, 3, 2, 1))).isFalse();
    }
}
