package com.portalrpg.rules;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Static V5 reference data (Apêndice 13). Factual fixtures only — names, levels,
 * mechanics. The INTEGRAL text of powers/lore comes from the indexed PDF at runtime
 * (F5), never hardcoded here. Sources of truth: prompt §9.6 + §13.1/13.2/13.6.
 */
public final class V5Catalog {

    private V5Catalog() {
    }

    // --- Clãs (núcleo + Companion) · §9.6 + §13.2 --------------------------

    public enum Clan {
        BRUJAH, GANGREL, MALKAVIAN, NOSFERATU, TOREADOR, TREMERE, VENTRUE,
        CAITIFF, THIN_BLOOD, RAVNOS, SALUBRI, TZIMISCE
    }

    /**
     * disciplines: as 3 disciplinas de clã (= "buffs"; vazia/Alquimia em casos especiais).
     * label: nome de exibição. description: arquétipo curto (síntese original, não texto do livro —
     * o texto integral vem do PDF indexado em runtime).
     */
    public record ClanInfo(Clan clan, String label, String description,
            List<String> disciplines, String bane, String compulsion) {
    }

    private static final Map<Clan, ClanInfo> CLANS = new LinkedHashMap<>();

    private static void clan(Clan c, String label, String description,
            List<String> disc, String bane, String compulsion) {
        CLANS.put(c, new ClanInfo(c, label, description, List.copyOf(disc), bane, compulsion));
    }

    static {
        clan(Clan.BRUJAH, "Brujah",
                "Rebeldes apaixonados e guerreiros-filósofos, movidos por ideais e fúria.",
                List.of("Celeridade", "Potência", "Presença"),
                "penalidade vs frenesi de fúria", "Rebelião");
        clan(Clan.GANGREL, "Gangrel",
                "Nômades ferais, próximos das feras e da terra, sobreviventes solitários.",
                List.of("Animalismo", "Fortitude", "Proteanismo"),
                "traços animais em frenesi", "Impulsos Ferais");
        clan(Clan.MALKAVIAN, "Malkavian",
                "Oráculos lunáticos; a loucura lhes revela verdades ocultas.",
                List.of("Auspícios", "Dominação", "Ofuscação"),
                "perturbação mental", "Delírio");
        clan(Clan.NOSFERATU, "Nosferatu",
                "Monstros das sombras: espiões desfigurados que tudo veem e tudo sabem.",
                List.of("Animalismo", "Ofuscação", "Potência"),
                "Repulsivo; sem Aparência", "Criptofilia");
        clan(Clan.TOREADOR, "Toreador",
                "Estetas seduzidos pela beleza, pela arte e pela paixão.",
                List.of("Auspícios", "Celeridade", "Presença"),
                "perde dados sem beleza", "Obsessão");
        clan(Clan.TREMERE, "Tremere",
                "Feiticeiros de sangue organizados em hierarquia rígida e ambiciosa.",
                List.of("Auspícios", "Dominação", "Feitiçaria de Sangue"),
                "Laço de Sangue alterado", "Perfeccionismo");
        clan(Clan.VENTRUE, "Ventrue",
                "Aristocratas natos: líderes, governantes e o sangue azul da estirpe.",
                List.of("Dominação", "Fortitude", "Presença"),
                "só bebe de presa específica", "Arrogância");
        clan(Clan.CAITIFF, "Caitiff",
                "Sem clã: herança incerta, sem fraqueza fixa nem disciplinas próprias.",
                List.of(),
                "nenhuma", "Defeito Suspeito");
        clan(Clan.THIN_BLOOD, "Sangue Fraco",
                "Geração distante, quase mortais; sobrevivem pela Alquimia.",
                List.of("Alquimia"),
                "sofre dano como mortal", "nenhuma");
        // Companion (§13.2)
        clan(Clan.RAVNOS, "Ravnos",
                "Andarilhos ilusionistas, amaldiçoados a nunca repousar no mesmo lugar.",
                List.of("Animalismo", "Ofuscação", "Presença"),
                "queima ao dormir 2x no mesmo local em 7 noites (dano agravado por Gravidade da Perdição)",
                "Destino Tentador");
        clan(Clan.SALUBRI, "Salubri",
                "Curandeiros caçados, marcados pelo terceiro olho que chora sangue.",
                List.of("Auspícios", "Dominação", "Fortitude"),
                "caçados: quem bebe seu vitae testa frenesi p/ parar; 3º olho chora sangue ao usar disciplina",
                "Empatia Afetiva");
        clan(Clan.TZIMISCE, "Tzimisce",
                "Senhores territoriais que moldam carne e terra à própria vontade.",
                List.of("Animalismo", "Dominação", "Proteanismo"),
                "enraizado: dormir cercado da posse escolhida ou dano agravado à FdV",
                "Cobiça");
    }

    public static List<ClanInfo> clans() {
        return List.copyOf(CLANS.values());
    }

    public static ClanInfo clan(Clan clan) {
        ClanInfo info = CLANS.get(clan);
        if (info == null) {
            throw new IllegalArgumentException("unknown clan: " + clan);
        }
        return info;
    }

    public static Clan clanOf(String name) {
        try {
            return Clan.valueOf(name.trim().toUpperCase().replace('-', '_').replace(' ', '_'));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("unknown clan: " + name);
        }
    }

    // --- Habilidades (27, 3 categorias) · §13.1 ----------------------------

    public enum AbilityCategory { FISICAS, SOCIAIS, MENTAIS }

    public record Ability(String name, AbilityCategory category) {
    }

    private static final List<Ability> ABILITIES = List.of(
            // Físicas (9)
            new Ability("Armas Brancas", AbilityCategory.FISICAS),
            new Ability("Armas de Fogo", AbilityCategory.FISICAS),
            new Ability("Atletismo", AbilityCategory.FISICAS),
            new Ability("Briga", AbilityCategory.FISICAS),
            new Ability("Condução", AbilityCategory.FISICAS),
            new Ability("Furtividade", AbilityCategory.FISICAS),
            new Ability("Ladroagem", AbilityCategory.FISICAS),
            new Ability("Ofícios", AbilityCategory.FISICAS),
            new Ability("Sobrevivência", AbilityCategory.FISICAS),
            // Sociais (9)
            new Ability("Empatia com Animais", AbilityCategory.SOCIAIS),
            new Ability("Etiqueta", AbilityCategory.SOCIAIS),
            new Ability("Sagacidade", AbilityCategory.SOCIAIS),
            new Ability("Intimidação", AbilityCategory.SOCIAIS),
            new Ability("Liderança", AbilityCategory.SOCIAIS),
            new Ability("Performance", AbilityCategory.SOCIAIS),
            new Ability("Persuasão", AbilityCategory.SOCIAIS),
            new Ability("Manha", AbilityCategory.SOCIAIS),
            new Ability("Subterfúgio", AbilityCategory.SOCIAIS),
            // Mentais (9)
            new Ability("Erudição", AbilityCategory.MENTAIS),
            new Ability("Percepção", AbilityCategory.MENTAIS),
            new Ability("Ciência", AbilityCategory.MENTAIS),
            new Ability("Finanças", AbilityCategory.MENTAIS),
            new Ability("Investigação", AbilityCategory.MENTAIS),
            new Ability("Medicina", AbilityCategory.MENTAIS),
            new Ability("Ocultismo", AbilityCategory.MENTAIS),
            new Ability("Política", AbilityCategory.MENTAIS),
            new Ability("Tecnologia", AbilityCategory.MENTAIS));

    public static List<Ability> abilities() {
        return ABILITIES;
    }

    public static List<Ability> abilities(AbilityCategory category) {
        return ABILITIES.stream().filter(a -> a.category() == category).toList();
    }

    // --- Disciplinas (§ Disciplinas) --------------------------------------
    // Fixtures factuais: nome da disciplina, resumo curto (original) e os NOMES dos
    // poderes por nível. O texto INTEGRAL de cada poder vem do PDF indexado (Chat IA),
    // nunca hardcoded aqui — mesma política dos clãs.

    public record Power(int level, String name) {
    }

    public record DisciplineInfo(String name, String summary, List<Power> powers) {
    }

    private static Power p(int lvl, String name) {
        return new Power(lvl, name);
    }

    private static final List<DisciplineInfo> DISCIPLINES = List.of(
            new DisciplineInfo("Animalismo",
                    "Comunhão e controle de animais e da Besta interior.",
                    List.of(p(1, "Sentir a Besta"), p(1, "Vínculo Famulus"),
                            p(2, "Sussurros Selvagens"), p(2, "Suculência Animal"),
                            p(3, "Acalmar a Besta"), p(3, "Colmeia Vívida"),
                            p(4, "Subsumir o Espírito"),
                            p(5, "Domínio Animal"), p(5, "Extrair a Besta"))),
            new DisciplineInfo("Auspícios",
                    "Sentidos aguçados, percepção sobrenatural e premonições.",
                    List.of(p(1, "Sentidos Aguçados"), p(1, "Sentir o Invisível"),
                            p(2, "Premonição"),
                            p(3, "Perscrutar a Alma"), p(3, "Compartilhar os Sentidos"),
                            p(4, "Toque do Espírito"),
                            p(5, "Clarividência"), p(5, "Telepatia"))),
            new DisciplineInfo("Celeridade",
                    "Velocidade e reflexos sobre-humanos.",
                    List.of(p(1, "Graça Felina"), p(1, "Reflexos Rápidos"),
                            p(2, "Velocidade Fantástica"),
                            p(3, "Investida Brutal"), p(3, "Esquiva Sobrenatural"),
                            p(4, "Passo do Vento"),
                            p(5, "Velocidade Relâmpago"))),
            new DisciplineInfo("Dominação",
                    "Controle da mente através de um olhar penetrante.",
                    List.of(p(1, "Hipnotizar"), p(1, "Cunhar"),
                            p(2, "Esquecer um Momento"),
                            p(3, "A Voz do Comando"), p(3, "Manobra Dissimulada"),
                            p(4, "Esquecimento Profundo"),
                            p(5, "Domínio da Massa"), p(5, "Possessão"))),
            new DisciplineInfo("Fortitude",
                    "Tenacidade sobrenatural: resistir a dano, fogo e luz solar.",
                    List.of(p(1, "Resiliência"), p(1, "Inabalável"),
                            p(2, "Vigor"),
                            p(3, "Defesa do Sangue Valente"), p(3, "Casca Fortalecida"),
                            p(4, "Aço Forjado"),
                            p(5, "Pele do Carvalho"))),
            new DisciplineInfo("Ofuscação",
                    "Permanecer obscuro e invisível, mesmo em meio a multidões.",
                    List.of(p(1, "Manto das Sombras"), p(1, "Presença Fugaz"),
                            p(2, "Máscara dos Mil Rostos"), p(2, "Véu da Distração"),
                            p(3, "Desaparecer"),
                            p(4, "Predador Invisível"),
                            p(5, "Imersão Total"))),
            new DisciplineInfo("Potência",
                    "Força e vigor físicos sobre-humanos.",
                    List.of(p(1, "Força Letal"), p(1, "Investida Fatal"),
                            p(2, "Punhos Pesados"),
                            p(3, "Salto Descomunal"), p(3, "Arremesso Brutal"),
                            p(4, "Golpe Demolidor"),
                            p(5, "Punho de Caim"))),
            new DisciplineInfo("Presença",
                    "Atrair, influenciar e controlar emoções.",
                    List.of(p(1, "Admiração"), p(1, "Olhar Atemorizante"),
                            p(2, "Presença Avassaladora"),
                            p(3, "Coração Apaixonado"), p(3, "Aura Cativante"),
                            p(4, "Súmula da Majestade"),
                            p(5, "Convocação"))),
            new DisciplineInfo("Proteanismo",
                    "Mudança de forma: garras, formas bestiais e fusão com a terra.",
                    List.of(p(1, "Olhos da Besta"), p(1, "Sentir a Terra"),
                            p(2, "Garras da Fera"),
                            p(3, "Forma de Névoa"), p(3, "Fundir-se à Terra"),
                            p(4, "Forma Metamórfica"),
                            p(5, "Forma do Mil Nuvens"))),
            new DisciplineInfo("Feitiçaria de Sangue",
                    "Magia do sangue e rituais (exclusiva de alguns clãs).",
                    List.of(p(1, "Corrupção do Sangue"), p(1, "Língua do Diabo"),
                            p(2, "Extrair Vitae"),
                            p(3, "Roubo de Vitae"),
                            p(4, "Cataclismo do Sangue"),
                            p(5, "Marca de Caim"))),
            new DisciplineInfo("Alquimia de Sangue-Ralo",
                    "Fórmulas alquímicas dos sangues-ralos (níveis = potência da fórmula).",
                    List.of(p(1, "Despertar do Sangue Adormecido"),
                            p(2, "Sangue Falso"),
                            p(3, "Toque Profano"),
                            p(4, "Envenenar o Poço"),
                            p(5, "Pulso da Profecia"))));

    public static List<DisciplineInfo> disciplines() {
        return DISCIPLINES;
    }

    // --- Tipos de Predador (pg.175) ---------------------------------------
    // name, resumo do estilo de caça e as 2 disciplinas que o tipo pode aumentar.
    // Detalhes (especialização/antecedente/defeito concedidos) vêm do livro (Chat IA).

    public record PredatorType(String name, String summary, List<String> disciplines) {
    }

    private static final List<PredatorType> PREDATORS = List.of(
            new PredatorType("Gatuno", "Caça pela força e violência, em becos e ruas.",
                    List.of("Celeridade", "Potência")),
            new PredatorType("Sacoleiro", "Compra ou rouba sangue preservado (bolsas).",
                    List.of("Feitiçaria de Sangue", "Ofuscação")),
            new PredatorType("Sanguessuga", "Alimenta-se de outros vampiros.",
                    List.of("Celeridade", "Proteanismo")),
            new PredatorType("Provedor", "Alimenta-se de pessoas próximas / da própria família.",
                    List.of("Dominação", "Animalismo")),
            new PredatorType("Consensualista", "Só se alimenta com consentimento.",
                    List.of("Auspícios", "Fortitude")),
            new PredatorType("Fazendeiro", "Alimenta-se de animais.",
                    List.of("Animalismo", "Proteanismo")),
            new PredatorType("Osíris", "Alimenta-se de seu culto, fãs ou seguidores.",
                    List.of("Feitiçaria de Sangue", "Presença")),
            new PredatorType("Sandman", "Alimenta-se de vítimas adormecidas.",
                    List.of("Auspícios", "Ofuscação")),
            new PredatorType("Rainha da Cena", "Alimenta-se de uma subcultura que adora.",
                    List.of("Ofuscação", "Presença")),
            new PredatorType("Sereia", "Alimenta-se por sedução.",
                    List.of("Fortitude", "Presença")));

    public static List<PredatorType> predatorTypes() {
        return PREDATORS;
    }

    // --- Antecedentes/Vantagens e Defeitos (nomes do livro p/ sugestão) ----

    private static final List<String> ADVANTAGES = List.of(
            "Aliados", "Contatos", "Influência", "Mentor", "Recursos", "Refúgio",
            "Rebanho", "Status", "Fama", "Lacaios", "Máscara", "Aclamação",
            "Criado", "Herança", "Território", "Sangue Resiliente");

    private static final List<String> FLAWS = List.of(
            "Inimigo", "Caçado", "Adversário", "Suspeito", "Notório", "Dívida",
            "Folclore Sombrio", "Repugnante", "Presa Restrita", "Conhecido");

    public static List<String> advantages() {
        return ADVANTAGES;
    }

    public static List<String> flaws() {
        return FLAWS;
    }

    // --- Ressonâncias do sangue + Tipos de Coterie ------------------------

    public record Resonance(String name, String emotion, List<String> disciplines) {
    }

    private static final List<Resonance> RESONANCES = List.of(
            new Resonance("Colérico", "raiva, violência", List.of("Celeridade", "Potência")),
            new Resonance("Melancólico", "tristeza, medo", List.of("Fortitude", "Ofuscação")),
            new Resonance("Fleumático", "calma, preguiça, controle", List.of("Auspícios", "Dominação")),
            new Resonance("Sanguíneo", "alegria, desejo, paixão", List.of("Feitiçaria de Sangue", "Presença")),
            new Resonance("Animal", "sangue de animais", List.of("Animalismo", "Proteanismo")));

    public static List<Resonance> resonances() {
        return RESONANCES;
    }

    public record CoterieType(String name, String summary) {
    }

    private static final List<CoterieType> COTERIES = List.of(
            new CoterieType("Grupo de Caça", "Captura presas para terceiros ou para a própria mesa."),
            new CoterieType("Guarda Diurna", "Protege os não-vivos enquanto dormem durante o dia."),
            new CoterieType("Nômades", "Viaja de um lugar a outro, sem refúgio fixo."),
            new CoterieType("Questári", "Busca realizar um grande empreendimento ou objetivo."),
            new CoterieType("Recência", "Administra os negócios até que um ancião retorne."),
            new CoterieType("Coterie Social", "Reúne-se por status, prazer e influência."));

    public static List<CoterieType> coterieTypes() {
        return COTERIES;
    }

    // --- Tabela de Potência de Sangue 0–6 (errata Companion §13.6) ---------

    /**
     * Linha da tabela de Potência de Sangue (já com a errata aplicada: Surto e
     * Gravidade da Perdição com +1; intervalo 0–6).
     */
    public record BloodPotencyTier(
            int potency,
            int bloodSurge,        // Surto de Sangue (bônus de dados)
            int rouseReroll,       // nível de disciplina até o qual rerrola Rouse (0 = nenhum)
            int disciplineBonus,   // bônus de dados em disciplinas
            int baneSeverity,      // Gravidade da Perdição
            int mendingRouse) {    // dano superficial recuperado por Rouse
    }

    // potency, surge, rouseReroll, discBonus, baneSeverity, mending
    private static final List<BloodPotencyTier> BLOOD_POTENCY = List.of(
            new BloodPotencyTier(0, 1, 0, 0, 0, 1),
            new BloodPotencyTier(1, 2, 1, 0, 2, 1),
            new BloodPotencyTier(2, 2, 1, 1, 2, 2),
            new BloodPotencyTier(3, 3, 2, 1, 3, 2),
            new BloodPotencyTier(4, 3, 2, 2, 3, 3),
            new BloodPotencyTier(5, 4, 3, 2, 4, 3),
            new BloodPotencyTier(6, 4, 3, 3, 4, 3));

    public static BloodPotencyTier bloodPotency(int potency) {
        if (potency < 0 || potency > 6) {
            throw new IllegalArgumentException("blood potency out of range 0–6: " + potency);
        }
        return BLOOD_POTENCY.get(potency);
    }

    // --- Tipos de personagem (§13.5) ---------------------------------------

    public enum CharacterType { VAMPIRO, MORTAL, CARNICAL }
}
