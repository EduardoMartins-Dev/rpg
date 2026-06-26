package com.portalrpg.rules;

import java.util.ArrayList;
import java.util.List;
import java.util.function.IntSupplier;

/**
 * Motor de regras de Vampiro V5 — domínio puro, isolado da camada web (prompt §5).
 * Valores conforme as fixtures §9. Sem aleatoriedade nos métodos de avaliação:
 * recebem as faces dos dados, então são 100% determinísticos e testáveis.
 */
public final class V5Engine {

    private V5Engine() {
    }

    public static final int TRAIT_MIN = 1;
    public static final int TRAIT_MAX = 5;
    public static final int HUNGER_MIN = 0;
    public static final int HUNGER_MAX = 5;

    // --- Derivados (§9.1) --------------------------------------------------

    /** Vitalidade = Vigor + 3. */
    public static int vitality(int vigor) {
        return vigor + 3;
    }

    /** Força de Vontade = Autocontrole + Determinação. */
    public static int willpower(int composure, int resolve) {
        return composure + resolve;
    }

    /** Faixas: atributos/habilidades 1–5. */
    public static void requireTraitRange(int value) {
        if (value < TRAIT_MIN || value > TRAIT_MAX) {
            throw new IllegalArgumentException("trait out of range 1–5: " + value);
        }
    }

    public static void requireHungerRange(int value) {
        if (value < HUNGER_MIN || value > HUNGER_MAX) {
            throw new IllegalArgumentException("hunger out of range 0–5: " + value);
        }
    }

    // --- Rolagem (§9.2) ----------------------------------------------------

    public record Die(int face, boolean hunger) {
        public Die {
            if (face < 1 || face > 10) {
                throw new IllegalArgumentException("die face out of range 1–10: " + face);
            }
        }
    }

    public enum RollOutcome { CRITICAL_WIN, WIN, FAILURE, BESTIAL_FAILURE }

    public record RollResult(
            List<Die> dice,
            int difficulty,
            int successes,
            RollOutcome outcome,
            boolean criticalWin,
            boolean bloodyCritical,
            boolean bestialFailure) {
    }

    /** Composição da parada de dados (§9.2): Fome substitui dados normais, tamanho fixo. */
    public record DicePool(int total, int normal, int hunger) {
    }

    public static DicePool pool(int attribute, int skill, int hunger) {
        requireHungerRange(hunger);
        int total = attribute + skill;
        int hungerDice = Math.min(hunger, total);
        return new DicePool(total, total - hungerDice, hungerDice);
    }

    /**
     * Avalia uma rolagem a partir das faces. {@code normalFaces} e {@code hungerFaces}
     * vêm da parada (ver {@link #pool}). Determinístico: serve às fixtures.
     */
    public static RollResult evaluate(List<Integer> normalFaces, List<Integer> hungerFaces, int difficulty) {
        List<Die> dice = new ArrayList<>();
        for (int f : normalFaces) {
            dice.add(new Die(f, false));
        }
        for (int f : hungerFaces) {
            dice.add(new Die(f, true));
        }
        return evaluateDice(dice, difficulty);
    }

    private static RollResult evaluateDice(List<Die> dice, int difficulty) {
        int tens = 0;
        int hungerTens = 0;
        int hungerOnes = 0;
        int base = 0;
        for (Die d : dice) {
            if (d.face() >= 6) {
                base++;
            }
            if (d.face() == 10) {
                tens++;
                if (d.hunger()) {
                    hungerTens++;
                }
            }
            if (d.face() == 1 && d.hunger()) {
                hungerOnes++;
            }
        }
        // par de 10 = 4 sucessos: cada par de 10 adiciona +2 além dos 2 contados em base.
        int successes = base + 2 * (tens / 2);
        boolean win = successes >= difficulty;
        boolean criticalWin = win && tens >= 2;
        boolean bloodyCritical = criticalWin && hungerTens >= 1;
        boolean bestialFailure = !win && hungerOnes >= 1;

        RollOutcome outcome;
        if (criticalWin) {
            outcome = RollOutcome.CRITICAL_WIN;
        } else if (win) {
            outcome = RollOutcome.WIN;
        } else if (bestialFailure) {
            outcome = RollOutcome.BESTIAL_FAILURE;
        } else {
            outcome = RollOutcome.FAILURE;
        }
        return new RollResult(List.copyOf(dice), difficulty, successes, outcome,
                criticalWin, bloodyCritical, bestialFailure);
    }

    /** Rolagem ao vivo: monta a parada e sorteia as faces. */
    public static RollResult roll(int attribute, int skill, int hunger, int difficulty, IntSupplier d10) {
        DicePool p = pool(attribute, skill, hunger);
        List<Integer> normal = new ArrayList<>();
        List<Integer> hungerFaces = new ArrayList<>();
        for (int i = 0; i < p.normal(); i++) {
            normal.add(d10.getAsInt());
        }
        for (int i = 0; i < p.hunger(); i++) {
            hungerFaces.add(d10.getAsInt());
        }
        return evaluate(normal, hungerFaces, difficulty);
    }

    /**
     * Força de Vontade rerrola até 3 dados NORMAIS (§9.2). Dado de Fome nunca rerrola.
     * {@code dieIndices} aponta para posições em {@code prev.dice()}; {@code newFaces}
     * traz as novas faces na mesma ordem. Reavalia o resultado.
     */
    public static RollResult willpowerReroll(RollResult prev, List<Integer> dieIndices, List<Integer> newFaces) {
        if (dieIndices.size() > 3) {
            throw new IllegalArgumentException("willpower rerolls at most 3 dice");
        }
        if (dieIndices.size() != newFaces.size()) {
            throw new IllegalArgumentException("dieIndices and newFaces must match");
        }
        List<Die> dice = new ArrayList<>(prev.dice());
        for (int k = 0; k < dieIndices.size(); k++) {
            int idx = dieIndices.get(k);
            Die d = dice.get(idx);
            if (d.hunger()) {
                throw new IllegalArgumentException("cannot reroll a Hunger die");
            }
            dice.set(idx, new Die(newFaces.get(k), false));
        }
        return evaluateDice(dice, prev.difficulty());
    }

    /**
     * Errata do Companion (§13.6): Compulsão pode disparar em Falha Bestial OU
     * Crítico Sangrento (não só Falha Bestial como no núcleo).
     */
    public static boolean compulsionTriggered(RollResult r) {
        return r.bestialFailure() || r.bloodyCritical();
    }

    // --- Rouse Check (§9.3) ------------------------------------------------

    public record RouseResult(int hunger, boolean increased) {
    }

    /** 1 dado: <6 → Fome+1 (cap 5); 6+ mantém. */
    public static RouseResult rouse(int currentHunger, int face) {
        requireHungerRange(currentHunger);
        if (face < 6) {
            return new RouseResult(Math.min(HUNGER_MAX, currentHunger + 1), true);
        }
        return new RouseResult(currentHunger, false);
    }

    // --- Dano (§9.4) -------------------------------------------------------

    public record HealthTrack(int max, int superficial, int aggravated) {
        public HealthTrack {
            if (max < 0 || superficial < 0 || aggravated < 0) {
                throw new IllegalArgumentException("track values must be non-negative");
            }
        }

        public int totalMarked() {
            return superficial + aggravated;
        }

        /** Trilha cheia → Debilitado (penalidade de −2 dados nas paradas ligadas). */
        public boolean impaired() {
            return totalMarked() >= max;
        }

        public int penalty() {
            return impaired() ? -2 : 0;
        }

        /** Trilha cheia de agravado → torpor. */
        public boolean torpor() {
            return aggravated >= max;
        }
    }

    /** Dano superficial vampírico: ÷2 arredondando p/ cima antes de marcar (§9.4). */
    public static HealthTrack applySuperficialVampiric(HealthTrack t, int raw) {
        int halved = (raw + 1) / 2;
        return markSuperficial(t, halved);
    }

    private static HealthTrack markSuperficial(HealthTrack t, int amount) {
        int superficial = t.superficial() + amount;
        int aggravated = t.aggravated();
        int total = superficial + aggravated;
        if (total > t.max()) {
            // excedente de superficial é promovido a agravado (one-for-one)
            int overflow = total - t.max();
            aggravated = Math.min(t.max(), aggravated + overflow);
            superficial = Math.max(0, t.max() - aggravated);
        }
        return new HealthTrack(t.max(), superficial, aggravated);
    }

    /** Dano agravado não é reduzido (§9.4). */
    public static HealthTrack applyAggravated(HealthTrack t, int raw) {
        int aggravated = Math.min(t.max(), t.aggravated() + raw);
        int superficial = Math.min(t.superficial(), Math.max(0, t.max() - aggravated));
        return new HealthTrack(t.max(), superficial, aggravated);
    }

    // --- XP (§9.5) ---------------------------------------------------------

    public enum TraitType {
        ATTRIBUTE, ABILITY, SPECIALIZATION, CLAN_DISCIPLINE, OTHER_DISCIPLINE,
        CAITIFF_DISCIPLINE, ADVANTAGE, BLOOD_POTENCY
    }

    /** Custo em XP de comprar {@code newLevel} (ou, p/ vantagem, {@code newLevel} pontos). */
    public static int xpCost(TraitType type, int newLevel) {
        if (newLevel < 1) {
            throw new IllegalArgumentException("newLevel must be >= 1");
        }
        return switch (type) {
            case ATTRIBUTE -> newLevel * 5;
            case ABILITY -> newLevel * 3;
            case SPECIALIZATION -> 3;
            case CLAN_DISCIPLINE -> newLevel * 5;
            case OTHER_DISCIPLINE -> newLevel * 7;
            case CAITIFF_DISCIPLINE -> newLevel * 6;
            case ADVANTAGE -> newLevel * 3;
            case BLOOD_POTENCY -> newLevel * 10;
        };
    }

    /** Subir 1 nível (não pula níveis): custo de currentLevel → currentLevel+1. */
    public static int xpCostRaise(TraitType type, int currentLevel) {
        return xpCost(type, currentLevel + 1);
    }

    // --- Point-buy de criação (§9.7) ---------------------------------------

    /** Padrão de atributos: um 4, três 3, quatro 2, um 1 (multiconjunto fixo). */
    private static final List<Integer> ATTRIBUTE_PATTERN =
            List.of(4, 3, 3, 3, 2, 2, 2, 2, 1).stream().sorted().toList();

    public static boolean isValidAttributeSpread(List<Integer> values) {
        if (values.size() != ATTRIBUTE_PATTERN.size()) {
            return false;
        }
        return values.stream().sorted().toList().equals(ATTRIBUTE_PATTERN);
    }

    public static void requireValidAttributeSpread(List<Integer> values) {
        if (!isValidAttributeSpread(values)) {
            throw new IllegalArgumentException(
                    "invalid attribute spread; expected one 4, three 3, four 2, one 1");
        }
    }
}
