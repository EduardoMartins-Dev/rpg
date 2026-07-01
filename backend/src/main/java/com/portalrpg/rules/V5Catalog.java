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
        BANU_HAQIM, HECATA, LASOMBRA, MINISTRY,
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
                "Rebeldes apaixonados e guerreiros-filósofos. Ser Brujah é arder por uma causa "
                        + "e lutar contra a injustiça — e contra a própria fúria, sempre à flor da pele.",
                List.of("Celeridade", "Potência", "Presença"),
                "Frenesi de fúria mais fácil: penalidade igual à Gravidade da Perdição em testes para resistir à fúria.",
                "Rebelião");
        clan(Clan.GANGREL, "Gangrel",
                "Nômades ferais, os mais próximos da Besta. Sobrevivem sozinhos, leem a estrada e a "
                        + "natureza — e a cada frenesi se parecem um pouco mais com os animais.",
                List.of("Animalismo", "Fortitude", "Proteanismo"),
                "Ao entrar em frenesi, ganham traços animais (penalidade ligada à Gravidade da Perdição) que perduram.",
                "Impulsos Ferais");
        clan(Clan.MALKAVIAN, "Malkavian",
                "Visionários tocados pela loucura. Enxergam padrões e verdades ocultas que os outros "
                        + "não veem — ao preço de uma mente fraturada que distorce a percepção.",
                List.of("Auspícios", "Dominação", "Ofuscação"),
                "Carregam uma perturbação mental que se manifesta sob estresse, impondo penalidade conforme a Gravidade da Perdição.",
                "Delírio");
        clan(Clan.NOSFERATU, "Nosferatu",
                "Monstros deformados condenados às sombras e aos esgotos. Trocam a aparência por "
                        + "segredos: são os melhores espiões e informantes da noite.",
                List.of("Animalismo", "Ofuscação", "Potência"),
                "Repugnantes: contam como tendo Aparência 0 e falham em testes sociais que dependam de causar boa impressão.",
                "Criptofilia");
        clan(Clan.TOREADOR, "Toreador",
                "Estetas apaixonados pela beleza, pela arte e pelo prazer. Atravessam a eternidade "
                        + "atrás da obra ou do instante perfeito — e se perdem nele.",
                List.of("Auspícios", "Celeridade", "Presença"),
                "Na ausência de beleza ao redor, perdem dados (igual à Gravidade da Perdição) ou ficam fascinados.",
                "Obsessão");
        clan(Clan.TREMERE, "Tremere",
                "Feiticeiros de sangue numa hierarquia rígida. Trocaram a magia mortal pela Feitiçaria "
                        + "de Sangue e por uma pirâmide de poder, lealdade e segredos.",
                List.of("Auspícios", "Dominação", "Feitiçaria de Sangue"),
                "Seu Laço de Sangue é instável: ligam-se com facilidade e seu vitae não cria laços como o de outros clãs.",
                "Perfeccionismo");
        clan(Clan.VENTRUE, "Ventrue",
                "Os 'Reis' da estirpe: líderes e aristocratas natos. Assumem o comando por direito "
                        + "presumido — e carregam um paladar de sangue exigente e seletivo.",
                List.of("Dominação", "Fortitude", "Presença"),
                "Só conseguem se alimentar de um tipo específico de presa; outro sangue é vomitado.",
                "Arrogância");
        clan(Clan.BANU_HAQIM, "Banu Haqim",
                "Juízes e assassinos guerreiros. Caçam quem viola sua lei e sentem uma atração "
                        + "perigosa pelo sangue de outros vampiros.",
                List.of("Feitiçaria de Sangue", "Celeridade", "Ofuscação"),
                "Ao saciar Fome com o sangue de outro vampiro, testam frenesi de Fome (Dif 2 + Gravidade da Perdição) para não cometer diablerie.",
                "Julgamento");
        clan(Clan.HECATA, "Hecata",
                "A Família da Morte: necromantes que negociam com os mortos e com o outro lado, "
                        + "mantendo laços de sangue e de família além da sepultura.",
                List.of("Auspícios", "Fortitude", "Oblivion"),
                "O Beijo deles é sempre doloroso: a presa nunca sente prazer e tende a resistir e se debater.",
                "Morbidez");
        clan(Clan.LASOMBRA, "Lasombra",
                "Predadores das sombras, ambiciosos e implacáveis. Comandam a escuridão e sobem pela "
                        + "hierarquia passando por cima de quem for preciso.",
                List.of("Dominação", "Oblivion", "Potência"),
                "Imagem distorcida em espelhos e gravações; perturbam aparelhos eletrônicos sensíveis ao toque.",
                "Crueldade");
        clan(Clan.MINISTRY, "Ministério",
                "Herdeiros de Set: tentadores que libertam — e escravizam — os outros pelos próprios "
                        + "vícios e transgressões.",
                List.of("Ofuscação", "Presença", "Proteanismo"),
                "A luz forte os fere mais: penalidade de dados igual à Gravidade da Perdição e dano aumentado por luz/sol.",
                "Transgressão");
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
     *  para a IA casar o poder com o trecho EN indexado; null quando não mapeado ainda.
     *  desc: resumo curto da MECÂNICA em PT (paráfrase original do efeito), exibido na ficha
     *  sempre — independente do material indexado, que é em inglês e pode não cobrir o poder. */
    public record Power(int level, String name, String en, String desc) {
    }

    public record DisciplineInfo(String name, String summary, List<Power> powers) {
    }

    private static Power p(int lvl, String name) {
        return new Power(lvl, name, null, null);
    }

    private static Power p(int lvl, String name, String en) {
        return new Power(lvl, name, en, null);
    }

    private static Power p(int lvl, String name, String en, String desc) {
        return new Power(lvl, name, en, desc);
    }

    // Poderes alinhados ao corebook V5 (nomes em PT p/ exibição + nome canônico em inglês
    // do livro, p/ a IA casar com o trecho EN indexado). Apenas nomes/níveis são fixtures;
    // o texto integral (mecânica, custo, amálgama) vem do PDF indexado em runtime.
    private static final List<DisciplineInfo> DISCIPLINES = List.of(
            new DisciplineInfo("Animalismo",
                    "Comunhão e controle de animais e da Besta interior.",
                    List.of(p(1, "Sentir a Besta", "Sense the Beast", "Passiva/simples, sem custo. Percebe a Besta em outro ser: raiva contida, Fome, natureza sobrenatural e propensão a frenesi. Se a pessoa esconder, é um teste resistido de Resolução + Animalismo contra Compostura + Lábia."),
                            p(1, "Vínculo Famulus", "Bond Famulus", "Ritual longo. Alimenta um animal com o próprio vitae por três noites (um Rouse Check cada) para criar um famulus vinculado, que passa a obedecê-lo e servir de canal para outros poderes de Animalismo."),
                            p(2, "Sussurros Selvagens", "Feral Whispers", "Um Rouse Check. Conversa com animais e dá ordens; para bichos comuns o Narrador decide, para tarefas complexas role Manipulação (ou Carisma) + Animalismo. Também convoca criaturas da região da espécie escolhida."),
                            p(2, "Suculência Animal", "Animal Succulence", "Passiva. Beber de animais sacia muito mais a Fome — o sangue animal alimenta quase como sangue humano, reduzindo mais pontos de Fome do que o normal."),
                            p(3, "Acalmar a Besta", "Quell the Beast", "Um Rouse Check, ação de conflito social: Carisma (intimidar) ou Manipulação (aplacar) + Animalismo contra a vítima. Sufoca a Besta do alvo, deixando-o apático e passivo, ou encerra um frenesi/estado de pânico."),
                            p(3, "Colmeia Vívida", "Unliving Hive", "Amálgama com Fortitude 2. Um Rouse Check. Aloja um enxame de insetos dentro do corpo, que pode ser liberado para espionar, atacar ou reforçar outros poderes de Animalismo."),
                            p(4, "Subsumir o Espírito", "Subsume the Spirit", "Um Rouse Check, teste de Manipulação + Animalismo. Projeta a própria mente para dentro de um animal e controla o corpo dele; o próprio corpo fica inerte e vulnerável enquanto isso."),
                            p(5, "Domínio Animal", "Animal Dominion", "Dois Rouse Checks. Carisma + Animalismo para comandar bandos e matilhas inteiras de uma só espécie ao mesmo tempo, lançando-os contra um alvo ou dirigindo-os por uma cena."),
                            p(5, "Extrair a Besta", "Drawing Out the Beast", "Um Rouse Check, teste resistido de Manipulação + Animalismo. Ao entrar em frenesi, expele a própria fúria para outra criatura ou pessoa por perto, que enlouquece no seu lugar."))),
            new DisciplineInfo("Auspícios",
                    "Sentidos aguçados, percepção sobrenatural e premonições.",
                    List.of(p(1, "Sentidos Aguçados", "Heightened Senses", "Passiva, ativável de graça. Amplia os cinco sentidos a níveis sobre-humanos (some a Auspícios em testes de percepção). Estímulos súbitos e intensos podem exigir um teste para não ser sobrecarregado."),
                            p(1, "Sentir o Invisível", "Sense the Unseen", "Simples, sem custo (ou um Rouse Check para busca ativa). Percebe o sobrenatural oculto — vampiros ofuscados, fantasmas, magia — com um teste de Percepção/Inteligência + Auspícios contra o poder que oculta."),
                            p(2, "Premonição", "Premonition", "Passiva; para forçar uma visão, um Rouse Check. Lampejos premonitórios de perigo iminente. O Narrador dá uma pista ou aviso; funciona como um sexto sentido que dispara sozinho em momentos críticos."),
                            p(3, "Perscrutar a Alma", "Scry the Soul", "Um Rouse Check, teste de Inteligência + Auspícios contra Compostura + Firmeza. Lê a aura de alguém: emoções, estado (doente, apaixonado, faminto), se é sobrenatural, a ressonância do sangue e as Manchas na alma."),
                            p(3, "Compartilhar os Sentidos", "Share the Senses", "Um Rouse Check. Sintoniza os sentidos de outra pessoa e passa a ver e ouvir através dela à distância, mesmo sem que ela saiba; alvos desconhecidos exigem um teste."),
                            p(4, "Toque do Espírito", "Spirit's Touch", "Um Rouse Check, teste de Inteligência + Auspícios. Ao tocar um objeto ou local, capta impressões psíquicas das últimas pessoas que o manusearam — emoções, imagens e pistas do passado dele."),
                            p(5, "Clarividência", "Clairvoyance", "Um Rouse Check e alguns minutos de concentração; teste de Inteligência + Auspícios. Projeta a percepção para observar um lugar conhecido à distância, colhendo detalhes por vários sentidos."),
                            p(5, "Telepatia", "Telepathy", "Um Rouse Check. Lê os pensamentos de superfície de alguém e projeta mensagens mente a mente; ler pensamentos protegidos ou resistidos é um teste de Resolução + Auspícios contra Firmeza + Compostura."),
                            p(5, "Possessão", "Possession", "Amálgama com Dominação 3. Dois Rouse Checks, teste resistido de Resolução + Auspícios. Expulsa a mente de um mortal e assume o controle do corpo dele; requer contato visual para iniciar."))),
            new DisciplineInfo("Celeridade",
                    "Velocidade e reflexos sobre-humanos.",
                    List.of(p(1, "Graça Felina", "Cat's Grace", "Passiva, sem custo. Equilíbrio perfeito: passa automaticamente em qualquer teste para manter o equilíbrio, andar em fios, beiras estreitas, etc."),
                            p(1, "Reflexos Rápidos", "Rapid Reflexes", "Passiva, sem custo. Reações velozes: permite ações reflexas rápidas e sacar armas ou reagir sem gastar a ação, além de reduzir surpresa."),
                            p(2, "Fugacidade", "Fleetness", "Um Rouse Check. Soma a pontuação de Celeridade a qualquer teste de Destreza (fora combate) e à Defesa durante a rodada — reflexos e agilidade sobre-humanos."),
                            p(3, "Lampejo", "Blink", "Um Rouse Check. Investe ou salta uma distância curta num único movimento relâmpago, cobrindo o terreno quase instantaneamente para atacar ou fugir."),
                            p(3, "Travessia", "Traversal", "Um Rouse Check. Corre em altíssima velocidade sobre superfícies impossíveis (água, paredes verticais) ou dá saltos enormes; role Destreza + Atletismo se houver risco."),
                            p(4, "Gole de Elegância", "Draught of Elegance", "Passiva no doador. Seu vitae concede Celeridade temporária a quem o bebe — útil para reforçar aliados ou lacaios, iniciando também um passo do Vínculo de Sangue."),
                            p(4, "Pontaria Infalível", "Unerring Aim", "Um Rouse Check, gasto como ação. Percebe o alvo em câmera lenta e mira com precisão sobre-humana: transforma um ataque à distância num acerto quase garantido (dificuldade drasticamente reduzida)."),
                            p(5, "Golpe Relâmpago", "Lightning Strike", "Um Rouse Check. Age com velocidade impossível de acompanhar: garante agir primeiro e ataca de forma quase impossível de defender (a vítima não soma Defesa)."),
                            p(5, "Fração de Segundo", "Split Second", "Um Rouse Check, reflexa. Move-se tão rápido que altera um instante crucial da cena — aparar uma bala, atravessar uma porta antes que feche — conforme o Narrador aprovar."))),
            new DisciplineInfo("Dominação",
                    "Controle da mente através de um olhar penetrante. Exige contato visual e uma língua que a vítima entenda.",
                    List.of(p(1, "Nublar a Memória", "Cloud Memory", "Um Rouse Check, teste de Carisma + Dominação contra Inteligência + Firmeza se resistido. Apaga da vítima a lembrança do último minuto ou de um momento recente específico."),
                            p(1, "Compelir", "Compel", "Sem custo (um Rouse Check se a vítima resistir). Uma ordem curta de uma frase que a vítima obedece imediatamente e de forma literal; Carisma + Dominação contra Inteligência + Firmeza."),
                            p(2, "Hipnotizar", "Mesmerize", "Um Rouse Check, teste de Manipulação + Dominação contra Inteligência + Firmeza. Implanta um comando complexo, de várias etapas, que a vítima executa depois, quando o gatilho que você definir ocorrer."),
                            p(2, "Demência", "Dementation", "Amálgama com Ofuscação 2. Um Rouse Check, Manipulação + Dominação. Instila distúrbio emocional, ansiedade ou surtos de insanidade na vítima ao longo de uma conversa, sem que ela note a origem."),
                            p(3, "A Mente Esquecida", "The Forgetful Mind", "Um Rouse Check, teste de Manipulação + Dominação contra Inteligência + Firmeza. Reescreve ou apaga memórias inteiras da vítima, criando lembranças falsas no lugar."),
                            p(3, "Diretiva Submersa", "Submerged Directive", "Adicionada a um uso de Hipnotizar. Deixa um comando latente e adormecido na mente da vítima, que dispara semanas ou meses depois quando o gatilho combinado acontecer."),
                            p(4, "Racionalizar", "Rationalize", "Passiva sobre alvos dominados. Faz a vítima acreditar que as ações que você a forçou a cometer foram escolha própria, inventando justificativas — ela não percebe ter sido controlada."),
                            p(5, "Manipulação em Massa", "Mass Manipulation", "Um Rouse Check adicional. Amplia qualquer outro poder de Dominação para atingir um grupo inteiro de uma só vez, em vez de uma pessoa."),
                            p(5, "Decreto Terminal", "Terminal Decree", "Passiva sobre a Dominação. Remove o limite de autopreservação: suas ordens podem forçar a vítima a se ferir gravemente ou até se matar."))),
            new DisciplineInfo("Fortitude",
                    "Tenacidade sobrenatural: resistir a dano, fogo e luz solar.",
                    List.of(p(1, "Resiliência", "Resilience", "Passiva, sem custo. Soma a pontuação de Fortitude à Vitalidade para fins de aparar dano, reduzindo o dano superficial sofrido a cada ataque."),
                            p(1, "Mente Inabalável", "Unswayable Mind", "Passiva; um Rouse Check para reforçar. Concede dados extras para resistir a coerção, leitura de mente, intimidação e manipulação sobrenatural."),
                            p(2, "Robustez", "Toughness", "Um Rouse Check. Soma a Fortitude ao dano físico aparado e ignora, por uma cena, as penalidades de ferimento causadas pelo dano superficial."),
                            p(2, "Bestas Resistentes", "Enduring Beasts", "Amálgama com Animalismo 1. Um Rouse Check. Estende a própria resistência sobrenatural a animais e ao famulus, tornando-os muito mais difíceis de matar."),
                            p(3, "Desafiar a Perdição", "Defy Bane", "Um Rouse Check, reflexa, teste de Resolução + Fortitude. Por uma cena, converte dano agravado que sofreria (de fogo, sol ou garras) em dano superficial."),
                            p(3, "Fortalecer a Fachada Interior", "Fortify the Inner Facade", "Passiva/reativa. Blinda a mente contra leitura, Auspícios e telepatia — quem tentar sondá-lo enfrenta a Fortitude como resistência."),
                            p(4, "Gole de Resistência", "Draught of Endurance", "Passiva no doador. Seu vitae concede Fortitude temporária a quem o bebe, blindando aliados ou lacaios (e iniciando um passo do Vínculo de Sangue)."),
                            p(5, "Pele de Mármore", "Flesh of Marble", "Dois Rouse Checks. Por uma cena, a pele fica dura como pedra: ignora automaticamente os primeiros pontos de dano físico de cada ataque recebido."),
                            p(5, "Proeza da Dor", "Prowess from Pain", "Um Rouse Check. Converte a dor em força: quanto mais casas de dano tiver na Vitalidade, mais bônus físicos ganha — fica mais forte ao ser ferido."))),
            new DisciplineInfo("Ofuscação",
                    "Permanecer obscuro e invisível, mesmo em meio a multidões.",
                    List.of(p(1, "Manto de Sombras", "Cloak of Shadows", "Passiva, sem custo. Fica imperceptível enquanto permanecer imóvel e junto a alguma cobertura (parede, sombra, canto); mover-se ou ser procurado ativamente quebra o efeito."),
                            p(1, "Silêncio da Morte", "Silence of Death", "Um Rouse Check. Anula todo o som que você produz — passos, voz, tiros — tornando suas ações completamente silenciosas por uma cena."),
                            p(2, "Passagem Invisível", "Unseen Passage", "Um Rouse Check. Move-se permanecendo oculto, mesmo andando; deixa de ser notado por observadores, mas interagir bruscamente ou atacar rompe a ofuscação."),
                            p(3, "Fantasma na Máquina", "Ghost in the Machine", "Amálgama com Tecnologia (Sabbat) ou Auspícios. Um Rouse Check. Estende a ofuscação a câmeras, sensores e gravações — dispositivos eletrônicos também deixam de registrá-lo."),
                            p(3, "Máscara dos Mil Rostos", "Mask of a Thousand Faces", "Um Rouse Check. Projeta uma aparência falsa e comum (um rosto qualquer, esquecível), permitindo passar despercebido em público como outra pessoa anônima."),
                            p(4, "Ocultar", "Conceal", "Amálgama com Auspícios 3. Um Rouse Check. Oculta um objeto inanimado ou um local inteiro da percepção alheia, mantendo-os invisíveis mesmo depois que você sai."),
                            p(4, "Desaparecer", "Vanish", "Um Rouse Check, ativável como reflexa. Some da vista mesmo estando sob observação direta: ativa a ofuscação no meio de um olhar, apagando-se da mente de quem observa."),
                            p(5, "Manto Coletivo", "Cloak the Gathering", "Um Rouse Check por pessoa. Estende a ofuscação a um grupo próximo, ocultando aliados junto com você enquanto eles seguirem suas instruções."),
                            p(5, "Disfarce do Impostor", "Impostor's Guise", "Um Rouse Check, teste de Manipulação + Ofuscação. Assume a aparência exata de uma pessoa específica que você já observou, copiando rosto, voz e porte."))),
            new DisciplineInfo("Potência",
                    "Força e vigor físicos sobre-humanos.",
                    List.of(p(1, "Corpo Letal", "Lethal Body", "Passiva; um Rouse Check para intensificar. Golpes desarmados causam dano agravado a mortais e ignoram armaduras leves — punhos e chutes viram armas mortais."),
                            p(1, "Salto Elevado", "Soaring Leap", "Passiva, sem custo. Salta distâncias horizontais e alturas enormes de um só pulo, alcançando telhados ou cruzando ruas sem impulso."),
                            p(2, "Proeza", "Prowess", "Um Rouse Check. Soma a pontuação de Potência ao dano de ataques corpo a corpo e a todos os feitos de força bruta (arrombar, levantar, arremessar) por uma cena."),
                            p(3, "Alimentação Brutal", "Brutal Feed", "Sem custo extra. Drena toda uma vítima em segundos, num ato violento e quase sempre letal, em vez do longo beijo do vampiro; útil em combate, mas escancarado."),
                            p(3, "Faísca de Fúria", "Spark of Rage", "Amálgama com Presença 3. Um Rouse Check, Manipulação + Potência. Incita raiva e violência súbita numa multidão ou indivíduo, podendo desencadear brigas e frenesi coletivo."),
                            p(3, "Aderência Sobrenatural", "Uncanny Grip", "Um Rouse Check. Agarra-se e sustenta o peso em qualquer superfície — paredes lisas, tetos, cordas finas — como se estivesse colado a ela."),
                            p(4, "Gole de Poder", "Draught of Might", "Passiva no doador. Seu vitae concede Potência temporária a quem o bebe, reforçando a força de aliados ou lacaios (e iniciando um passo do Vínculo de Sangue)."),
                            p(5, "Abalo Sísmico", "Earthshock", "Dois Rouse Checks. Golpeia o chão com força descomunal, gerando uma onda de choque que derruba e fere todos numa área ao redor."),
                            p(5, "Punho de Caim", "Fist of Caine", "Um Rouse Check. Concentra força devastadora num golpe capaz de arrancar membros, atravessar paredes e causar dano físico brutal, com ferimentos que custam a sarar."))),
            new DisciplineInfo("Presença",
                    "Atrair, influenciar e controlar emoções.",
                    List.of(p(1, "Admiração", "Awe", "Um Rouse Check, teste de Carisma + Presença. Torna-se magneticamente atraente e cativante para todos por perto, que passam a admirá-lo e a lhe dar o benefício da dúvida por uma cena."),
                            p(1, "Intimidar", "Daunt", "Um Rouse Check (ou passiva). Projeta uma aura ameaçadora que afasta, intimida e desencoraja os outros de se aproximarem ou confrontá-lo; some a Presença a testes de intimidação."),
                            p(2, "Beijo Persistente", "Lingering Kiss", "Passiva ao alimentar-se. Sua mordida causa êxtase viciante que beneficia a vítima temporariamente, mas cria dependência — ela passa a desejar o próximo beijo."),
                            p(3, "Olhar Aterrador", "Dread Gaze", "Um Rouse Check, teste de Carisma + Presença contra Compostura + Firmeza. Um olhar e gesto que enchem a vítima de terror, fazendo-a fugir, congelar ou entrar em frenesi de medo."),
                            p(3, "Enlevo", "Entrancement", "Um Rouse Check, teste de Manipulação + Presença contra Compostura + Firmeza. Enfeitiça a vítima, que passa a querer agradá-lo e ganhar sua aprovação acima de tudo por horas."),
                            p(4, "Voz Irresistível", "Irresistible Voice", "Amálgama passiva com Dominação. Suas ordens de Dominação dispensam o contato visual — basta a voz ser ouvida, permitindo dominar por telefone ou no escuro."),
                            p(4, "Convocar", "Summon", "Um Rouse Check, teste de Manipulação + Presença. Chama à distância alguém em quem já usou Presença; a pessoa sente a compulsão de vir até você, atravessando cidades se preciso."),
                            p(5, "Majestade", "Majesty", "Dois Rouse Checks, teste de Carisma + Presença contra Compostura + Firmeza. Presença avassaladora e imperial: ninguém ousa atacá-lo, contrariá-lo ou desviar o olhar por uma cena."),
                            p(5, "Magnetismo Estelar", "Star Magnetism", "Um Rouse Check adicional. Faz os efeitos de Presença alcançarem através de mídia — transmissões, telas, gravações ao vivo — atingindo quem apenas o vê ou ouve remotamente."))),
            new DisciplineInfo("Proteanismo",
                    "Mudança de forma: garras, formas bestiais e fusão com a terra.",
                    List.of(p(1, "Olhos da Besta", "Eyes of the Beast", "Passiva, sem custo. Enxerga perfeitamente no escuro total; ao ativar, os olhos brilham de forma bestial, servindo também para intimidar."),
                            p(1, "Peso da Pluma", "Weight of the Feather", "Passiva, reflexa, sem custo. Torna-se leve como uma pluma: ignora dano de quedas, caminha sobre superfícies frágeis e resiste a ser derrubado ou empurrado."),
                            p(2, "Armas Ferais", "Feral Weapons", "Um Rouse Check. Faz crescer garras longas e afiadas (ou presas) que causam dano agravado em combate e servem para escalar e dilacerar; dura uma cena."),
                            p(3, "Fundir-se à Terra", "Earth Meld", "Um Rouse Check. Afunda e se funde ao solo natural, ficando protegido e escondido dentro da terra durante o dia ou para descansar em segurança."),
                            p(3, "Mudança de Forma", "Shapechange", "Um Rouse Check. Assume a forma de um animal do tamanho de um humano — geralmente lobo ou morcego grande — mantendo a mente e ganhando as capacidades do bicho."),
                            p(4, "Metamorfose", "Metamorphosis", "Dois Rouse Checks. Amplia a mudança de forma para criaturas muito maiores ou menores, ou formas monstruosas e híbridas, incluindo enxames e bestas colossais."),
                            p(5, "Forma de Névoa", "Mist Form", "Um Rouse Check. Dissolve-se em névoa: fica imune à maior parte do dano físico e atravessa frestas, grades e fechaduras, embora vulnerável a vento e fogo."),
                            p(5, "O Coração Livre", "The Unfettered Heart", "Passiva, um Rouse Check para ativar. Desloca o próprio coração dentro do corpo, tornando o estaqueamento quase impossível de acertar."))),
            new DisciplineInfo("Feitiçaria de Sangue",
                    "Magia do sangue (exclusiva de alguns clãs); além dos poderes, há rituais aprendidos à parte.",
                    List.of(p(1, "Vitae Corrosivo", "Corrosive Vitae", "Um Rouse Check. Torna uma porção do próprio sangue num ácido capaz de corroer e derreter matéria — metal, madeira, fechaduras, correntes."),
                            p(1, "Gosto pelo Sangue", "A Taste for Blood", "Sem custo, ao provar um pouco do sangue de alguém. Teste de Inteligência + Feitiçaria de Sangue revela dados sobre a criatura: humano/vampiro, geração aproximada, ressonância e se se alimentou há pouco."),
                            p(2, "Extinguir Vitae", "Extinguish Vitae", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue contra Firmeza + Compostura. Queima o sangue armazenado da vítima, forçando Rouse Checks extras que elevam a Fome dela — chega a arrastá-la para o frenesi."),
                            p(3, "Sangue de Potência", "Blood of Potency", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue. Eleva temporariamente a própria Potência de Sangue por uma cena, potencializando disciplinas e superando limites de geração."),
                            p(3, "Toque do Escorpião", "Scorpion's Touch", "Um Rouse Check, teste de Força/Destreza + Feitiçaria de Sangue. Converte o vitae num veneno paralisante aplicado por toque ou em uma lâmina, reduzindo os atributos físicos da vítima."),
                            p(4, "Roubo de Vitae", "Theft of Vitae", "Um Rouse Check, teste de Resolução + Feitiçaria de Sangue contra a vítima. Arranca o sangue do alvo à distância, num jorro que cruza o ar até você, saciando a própria Fome."),
                            p(5, "Carícia de Baal", "Baal's Caress", "Um Rouse Check. Envenena o próprio sangue em lâminas ou toques de modo que cause dano agravado a quem for atingido — uma arma mortal contra mortais e vampiros."),
                            p(5, "Caldeirão de Sangue", "Cauldron of Blood", "Dois Rouse Checks, teste de Resolução + Feitiçaria de Sangue contra Firmeza + Compostura. Ferve o sangue dentro do corpo da vítima, causando dano agravado devastador; exige contato visual."))),
            new DisciplineInfo("Alquimia de Sangue-Ralo",
                    "Fórmulas alquímicas dos sangues-ralos (o nível indica a potência da fórmula destilada).",
                    List.of(p(1, "Alcance Distante", "Far Reach", "Uma fórmula alquímica (custa Rouse Checks para destilar). Concede telecinese: move, puxa e arremessa objetos ou pessoas à distância com um teste de Resolução + Alquimia de Sangue-Ralo."),
                            p(1, "Névoa", "Haze", "Fórmula de nível 1. Exala uma névoa densa que cobre a área e obscurece a visão, criando cobertura para fugir, esconder-se ou preparar uma emboscada."),
                            p(2, "Envolver", "Envelop", "Fórmula de nível 2. A névoa se concentra ao redor de um alvo, sufocando-o e cegando-o; a vítima resiste com testes conforme luta para escapar."),
                            p(2, "Hieros Gamos Profano", "Profane Hieros Gamos", "Fórmula de nível 2. Ritual alquímico que troca temporariamente de corpo (ou aparência) com outra pessoa, permitindo assumir a vida e a forma dela por um tempo."),
                            p(3, "Desfracionar", "Defractionate", "Fórmula de nível 3. Reconstitui sangue estocado, fracionado ou desidratado (bolsas de banco de sangue) de volta a um estado que vampiros conseguem beber e digerir."),
                            p(4, "Ímpeto Aéreo", "Airborne Momentum", "Fórmula de nível 4. Concede a si mesmo a capacidade de voar ou planar por uma cena, movendo-se pelo ar com um teste de Destreza/Resolução + Alquimia de Sangue-Ralo."),
                            p(5, "Despertar o Adormecido", "Awaken the Sleeper", "Fórmula de nível 5. Desperta à força um vampiro em torpor ou no sono diurno, arrancando-o do descanso mesmo contra a vontade dele."))));

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
