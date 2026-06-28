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

    /** name: nome em PT (exibição). en: nome canônico em inglês do livro (corebook), usado
     *  para a IA casar o poder com o trecho EN indexado; null quando não mapeado ainda. */
    public record Power(int level, String name, String en) {
    }

    public record DisciplineInfo(String name, String summary, List<Power> powers) {
    }

    private static Power p(int lvl, String name) {
        return new Power(lvl, name, null);
    }

    private static Power p(int lvl, String name, String en) {
        return new Power(lvl, name, en);
    }

    // Poderes alinhados ao corebook V5 (nomes em PT p/ exibição + nome canônico em inglês
    // do livro, p/ a IA casar com o trecho EN indexado). Apenas nomes/níveis são fixtures;
    // o texto integral (mecânica, custo, amálgama) vem do PDF indexado em runtime.
    private static final List<DisciplineInfo> DISCIPLINES = List.of(
            new DisciplineInfo("Animalismo",
                    "Comunhão e controle de animais e da Besta interior.",
                    List.of(p(1, "Sentir a Besta", "Sense the Beast"),
                            p(1, "Vínculo Famulus", "Bond Famulus"),
                            p(2, "Sussurros Selvagens", "Feral Whispers"),
                            p(2, "Suculência Animal", "Animal Succulence"),
                            p(3, "Acalmar a Besta", "Quell the Beast"),
                            p(3, "Colmeia Vívida", "Unliving Hive"),
                            p(4, "Subsumir o Espírito", "Subsume the Spirit"),
                            p(5, "Domínio Animal", "Animal Dominion"),
                            p(5, "Extrair a Besta", "Drawing Out the Beast"))),
            new DisciplineInfo("Auspícios",
                    "Sentidos aguçados, percepção sobrenatural e premonições.",
                    List.of(p(1, "Sentidos Aguçados", "Heightened Senses"),
                            p(1, "Sentir o Invisível", "Sense the Unseen"),
                            p(2, "Premonição", "Premonition"),
                            p(3, "Perscrutar a Alma", "Scry the Soul"),
                            p(3, "Compartilhar os Sentidos", "Share the Senses"),
                            p(4, "Toque do Espírito", "Spirit's Touch"),
                            p(5, "Clarividência", "Clairvoyance"),
                            p(5, "Telepatia", "Telepathy"),
                            p(5, "Possessão", "Possession"))),
            new DisciplineInfo("Celeridade",
                    "Velocidade e reflexos sobre-humanos.",
                    List.of(p(1, "Graça Felina", "Cat's Grace"),
                            p(1, "Reflexos Rápidos", "Rapid Reflexes"),
                            p(2, "Fugacidade", "Fleetness"),
                            p(3, "Lampejo", "Blink"), p(3, "Travessia", "Traversal"),
                            p(4, "Gole de Elegância", "Draught of Elegance"),
                            p(4, "Pontaria Infalível", "Unerring Aim"),
                            p(5, "Golpe Relâmpago", "Lightning Strike"),
                            p(5, "Fração de Segundo", "Split Second"))),
            new DisciplineInfo("Dominação",
                    "Controle da mente através de um olhar penetrante.",
                    List.of(p(1, "Nublar a Memória", "Cloud Memory"),
                            p(1, "Compelir", "Compel"),
                            p(2, "Hipnotizar", "Mesmerize"),
                            p(2, "Demência", "Dementation"),
                            p(3, "A Mente Esquecida", "The Forgetful Mind"),
                            p(3, "Diretiva Submersa", "Submerged Directive"),
                            p(4, "Racionalizar", "Rationalize"),
                            p(5, "Manipulação em Massa", "Mass Manipulation"),
                            p(5, "Decreto Terminal", "Terminal Decree"))),
            new DisciplineInfo("Fortitude",
                    "Tenacidade sobrenatural: resistir a dano, fogo e luz solar.",
                    List.of(p(1, "Resiliência", "Resilience"),
                            p(1, "Mente Inabalável", "Unswayable Mind"),
                            p(2, "Robustez", "Toughness"),
                            p(2, "Bestas Resistentes", "Enduring Beasts"),
                            p(3, "Desafiar a Perdição", "Defy Bane"),
                            p(3, "Fortalecer a Fachada Interior", "Fortify the Inner Facade"),
                            p(4, "Gole de Resistência", "Draught of Endurance"),
                            p(5, "Pele de Mármore", "Flesh of Marble"),
                            p(5, "Proeza da Dor", "Prowess from Pain"))),
            new DisciplineInfo("Ofuscação",
                    "Permanecer obscuro e invisível, mesmo em meio a multidões.",
                    List.of(p(1, "Manto de Sombras", "Cloak of Shadows"),
                            p(1, "Silêncio da Morte", "Silence of Death"),
                            p(2, "Passagem Invisível", "Unseen Passage"),
                            p(3, "Fantasma na Máquina", "Ghost in the Machine"),
                            p(3, "Máscara dos Mil Rostos", "Mask of a Thousand Faces"),
                            p(4, "Ocultar", "Conceal"),
                            p(4, "Desaparecer", "Vanish"),
                            p(5, "Manto Coletivo", "Cloak the Gathering"),
                            p(5, "Disfarce do Impostor", "Impostor's Guise"))),
            new DisciplineInfo("Potência",
                    "Força e vigor físicos sobre-humanos.",
                    List.of(p(1, "Corpo Letal", "Lethal Body"),
                            p(1, "Salto Elevado", "Soaring Leap"),
                            p(2, "Proeza", "Prowess"),
                            p(3, "Alimentação Brutal", "Brutal Feed"),
                            p(3, "Faísca de Fúria", "Spark of Rage"),
                            p(3, "Aderência Sobrenatural", "Uncanny Grip"),
                            p(4, "Gole de Poder", "Draught of Might"),
                            p(5, "Abalo Sísmico", "Earthshock"),
                            p(5, "Punho de Caim", "Fist of Caine"))),
            new DisciplineInfo("Presença",
                    "Atrair, influenciar e controlar emoções.",
                    List.of(p(1, "Admiração", "Awe"),
                            p(1, "Intimidar", "Daunt"),
                            p(2, "Beijo Persistente", "Lingering Kiss"),
                            p(3, "Olhar Aterrador", "Dread Gaze"),
                            p(3, "Enlevo", "Entrancement"),
                            p(4, "Voz Irresistível", "Irresistible Voice"),
                            p(4, "Convocar", "Summon"),
                            p(5, "Majestade", "Majesty"),
                            p(5, "Magnetismo Estelar", "Star Magnetism"))),
            new DisciplineInfo("Proteanismo",
                    "Mudança de forma: garras, formas bestiais e fusão com a terra.",
                    List.of(p(1, "Olhos da Besta", "Eyes of the Beast"),
                            p(1, "Peso da Pluma", "Weight of the Feather"),
                            p(2, "Armas Ferais", "Feral Weapons"),
                            p(3, "Fundir-se à Terra", "Earth Meld"),
                            p(3, "Mudança de Forma", "Shapechange"),
                            p(4, "Metamorfose", "Metamorphosis"),
                            p(5, "Forma de Névoa", "Mist Form"),
                            p(5, "O Coração Livre", "The Unfettered Heart"))),
            new DisciplineInfo("Feitiçaria de Sangue",
                    "Magia do sangue (exclusiva de alguns clãs); além dos poderes, há rituais.",
                    List.of(p(1, "Vitae Corrosivo", "Corrosive Vitae"),
                            p(1, "Gosto pelo Sangue", "A Taste for Blood"),
                            p(2, "Extinguir Vitae", "Extinguish Vitae"),
                            p(3, "Sangue de Potência", "Blood of Potency"),
                            p(3, "Toque do Escorpião", "Scorpion's Touch"),
                            p(4, "Roubo de Vitae", "Theft of Vitae"),
                            p(5, "Carícia de Baal", "Baal's Caress"),
                            p(5, "Caldeirão de Sangue", "Cauldron of Blood"))),
            new DisciplineInfo("Alquimia de Sangue-Ralo",
                    "Fórmulas alquímicas dos sangues-ralos (níveis = potência da fórmula).",
                    List.of(p(1, "Alcance Distante", "Far Reach"),
                            p(1, "Névoa", "Haze"),
                            p(2, "Envolver", "Envelop"),
                            p(2, "Hieros Gamos Profano", "Profane Hieros Gamos"),
                            p(3, "Desfracionar", "Defractionate"),
                            p(4, "Ímpeto Aéreo", "Airborne Momentum"),
                            p(5, "Despertar o Adormecido", "Awaken the Sleeper"))));

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
