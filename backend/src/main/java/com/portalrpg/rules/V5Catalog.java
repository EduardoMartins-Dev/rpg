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
                    List.of(p(1, "Sentir a Besta", "Sense the Beast", "Percebe raiva, fome, frenesi e a natureza sobrenatural em alguém por perto."),
                            p(1, "Vínculo Famulus", "Bond Famulus", "Cria um laço com um animal de estimação (famulus), alimentando-o com o próprio vitae."),
                            p(2, "Sussurros Selvagens", "Feral Whispers", "Comunica-se com animais e dá ordens a eles; pode convocar bichos da região."),
                            p(2, "Suculência Animal", "Animal Succulence", "Sangue de animais sacia muito mais a Fome do que o normal."),
                            p(3, "Acalmar a Besta", "Quell the Beast", "Suprime a Besta de uma vítima (deixando-a apática) ou interrompe um frenesi."),
                            p(3, "Colmeia Vívida", "Unliving Hive", "Abriga um enxame de insetos no próprio corpo, usável com outros poderes."),
                            p(4, "Subsumir o Espírito", "Subsume the Spirit", "Projeta a própria mente para dentro de um animal e controla o corpo dele."),
                            p(5, "Domínio Animal", "Animal Dominion", "Comanda bandos e matilhas inteiras de animais ao mesmo tempo."),
                            p(5, "Extrair a Besta", "Drawing Out the Beast", "Transfere a própria fúria/frenesi para outra criatura, que enlouquece no seu lugar."))),
            new DisciplineInfo("Auspícios",
                    "Sentidos aguçados, percepção sobrenatural e premonições.",
                    List.of(p(1, "Sentidos Aguçados", "Heightened Senses", "Amplia os cinco sentidos a níveis sobre-humanos."),
                            p(1, "Sentir o Invisível", "Sense the Unseen", "Percebe o sobrenatural oculto: ofuscados, fantasmas e magia."),
                            p(2, "Premonição", "Premonition", "Lampejos premonitórios que pressentem perigo e dão pistas do Narrador."),
                            p(3, "Perscrutar a Alma", "Scry the Soul", "Lê a aura de alguém: emoções, condição, ressonância e manchas."),
                            p(3, "Compartilhar os Sentidos", "Share the Senses", "Enxerga e ouve através dos sentidos de outra pessoa, à distância."),
                            p(4, "Toque do Espírito", "Spirit's Touch", "Ao tocar um objeto, capta impressões psíquicas de quem o manuseou."),
                            p(5, "Clarividência", "Clairvoyance", "Projeta a percepção para observar à distância um local conhecido."),
                            p(5, "Telepatia", "Telepathy", "Lê pensamentos e conversa mente a mente."),
                            p(5, "Possessão", "Possession", "Assume o controle do corpo de um mortal (amálgama com Dominação)."))),
            new DisciplineInfo("Celeridade",
                    "Velocidade e reflexos sobre-humanos.",
                    List.of(p(1, "Graça Felina", "Cat's Grace", "Equilíbrio perfeito: passa automaticamente em qualquer teste de equilíbrio."),
                            p(1, "Reflexos Rápidos", "Rapid Reflexes", "Reações velozes: ações reflexas e saque de arma sem gastar ação."),
                            p(2, "Fugacidade", "Fleetness", "Gasta um Rouse Check para somar a Celeridade a testes de Destreza e à defesa."),
                            p(3, "Lampejo", "Blink", "Investe ou salta uma curta distância num único movimento relâmpago."),
                            p(3, "Travessia", "Traversal", "Corre sobre superfícies impossíveis (água, paredes) ou salta distâncias enormes."),
                            p(4, "Gole de Elegância", "Draught of Elegance", "Seu sangue confere Celeridade temporária a quem o bebe (e inicia um Vínculo)."),
                            p(4, "Pontaria Infalível", "Unerring Aim", "Gasta um Rouse Check para mirar com precisão sobre-humana num ataque à distância."),
                            p(5, "Golpe Relâmpago", "Lightning Strike", "Gasta um Rouse Check para atacar primeiro, com velocidade quase impossível de defender."),
                            p(5, "Fração de Segundo", "Split Second", "Gasta um Rouse Check para agir num instante crucial e alterar a cena (a critério do Narrador)."))),
            new DisciplineInfo("Dominação",
                    "Controle da mente através de um olhar penetrante.",
                    List.of(p(1, "Nublar a Memória", "Cloud Memory", "Faz a vítima esquecer o último minuto ou um momento recente."),
                            p(1, "Compelir", "Compel", "Uma ordem curta e direta que a vítima obedece na hora."),
                            p(2, "Hipnotizar", "Mesmerize", "Implanta um comando mais complexo, executado quando você determinar."),
                            p(2, "Demência", "Dementation", "Instila distúrbio emocional ou insanidade na vítima (amálgama com Ofuscação)."),
                            p(3, "A Mente Esquecida", "The Forgetful Mind", "Reescreve ou apaga memórias inteiras da vítima."),
                            p(3, "Diretiva Submersa", "Submerged Directive", "Deixa um comando latente que dispara por um gatilho futuro."),
                            p(4, "Racionalizar", "Rationalize", "A vítima justifica para si mesma as ações que você a obrigou a fazer."),
                            p(5, "Manipulação em Massa", "Mass Manipulation", "Aplica a Dominação a um grupo inteiro de uma só vez."),
                            p(5, "Decreto Terminal", "Terminal Decree", "As ordens podem forçar a vítima a se ferir ou até se matar."))),
            new DisciplineInfo("Fortitude",
                    "Tenacidade sobrenatural: resistir a dano, fogo e luz solar.",
                    List.of(p(1, "Resiliência", "Resilience", "Soma a Fortitude para reduzir o dano sofrido à Vitalidade."),
                            p(1, "Mente Inabalável", "Unswayable Mind", "Resistência extra contra coerção mental e social."),
                            p(2, "Robustez", "Toughness", "Ignora penalidades de dano superficial ou reduz dano físico."),
                            p(2, "Bestas Resistentes", "Enduring Beasts", "Estende a resistência sobrenatural a animais e famulus (amálgama com Animalismo)."),
                            p(3, "Desafiar a Perdição", "Defy Bane", "Gasta um Rouse Check para converter dano agravado em superficial por um tempo."),
                            p(3, "Fortalecer a Fachada Interior", "Fortify the Inner Facade", "Protege a mente contra leitura, Auspícios e telepatia."),
                            p(4, "Gole de Resistência", "Draught of Endurance", "Seu sangue confere Fortitude temporária a quem o bebe."),
                            p(5, "Pele de Mármore", "Flesh of Marble", "Pele dura como pedra: ignora os primeiros pontos de dano físico por turno."),
                            p(5, "Proeza da Dor", "Prowess from Pain", "Quanto mais ferido, mais forte: converte o dano sofrido em bônus."))),
            new DisciplineInfo("Ofuscação",
                    "Permanecer obscuro e invisível, mesmo em meio a multidões.",
                    List.of(p(1, "Manto de Sombras", "Cloak of Shadows", "Fica imperceptível enquanto imóvel, junto a alguma cobertura."),
                            p(1, "Silêncio da Morte", "Silence of Death", "Anula todo o som que você produz."),
                            p(2, "Passagem Invisível", "Unseen Passage", "Move-se permanecendo oculto, mesmo andando."),
                            p(3, "Fantasma na Máquina", "Ghost in the Machine", "A ofuscação engana câmeras e gravações eletrônicas (amálgama com Tecnologia)."),
                            p(3, "Máscara dos Mil Rostos", "Mask of a Thousand Faces", "Projeta um rosto e aparência comuns e falsos."),
                            p(4, "Ocultar", "Conceal", "Oculta um objeto ou local da percepção alheia."),
                            p(4, "Desaparecer", "Vanish", "Some de vista no meio de uma observação direta."),
                            p(5, "Manto Coletivo", "Cloak the Gathering", "Estende a ofuscação a um grupo próximo."),
                            p(5, "Disfarce do Impostor", "Impostor's Guise", "Assume a aparência exata de uma pessoa específica."))),
            new DisciplineInfo("Potência",
                    "Força e vigor físicos sobre-humanos.",
                    List.of(p(1, "Corpo Letal", "Lethal Body", "Golpes desarmados causam dano agravado a mortais e ignoram armadura leve."),
                            p(1, "Salto Elevado", "Soaring Leap", "Salta distâncias e alturas enormes."),
                            p(2, "Proeza", "Prowess", "Gasta um Rouse Check para somar a Potência ao dano e à força física."),
                            p(3, "Alimentação Brutal", "Brutal Feed", "Drena toda uma vítima em segundos."),
                            p(3, "Faísca de Fúria", "Spark of Rage", "Provoca raiva e frenesi numa multidão ou num indivíduo (amálgama com Presença)."),
                            p(3, "Aderência Sobrenatural", "Uncanny Grip", "Agarra-se a qualquer superfície, inclusive paredes e tetos."),
                            p(4, "Gole de Poder", "Draught of Might", "Seu sangue confere Potência temporária a quem o bebe."),
                            p(5, "Abalo Sísmico", "Earthshock", "Golpeia o chão gerando uma onda de choque na área."),
                            p(5, "Punho de Caim", "Fist of Caine", "Dano descomunal: capaz de arrancar membros e devastar."))),
            new DisciplineInfo("Presença",
                    "Atrair, influenciar e controlar emoções.",
                    List.of(p(1, "Admiração", "Awe", "Torna-se magneticamente atraente, cativando quem está por perto."),
                            p(1, "Intimidar", "Daunt", "Projeta uma presença ameaçadora que afasta ou intimida."),
                            p(2, "Beijo Persistente", "Lingering Kiss", "Sua mordida vicia e beneficia a vítima, criando dependência."),
                            p(3, "Olhar Aterrador", "Dread Gaze", "Um olhar e gesto que aterrorizam a vítima, podendo causar frenesi de medo."),
                            p(3, "Enlevo", "Entrancement", "Enfeitiça alguém, que passa a querer agradá-lo acima de tudo."),
                            p(4, "Voz Irresistível", "Irresistible Voice", "Suas ordens de Dominação dispensam o contato visual (amálgama com Dominação)."),
                            p(4, "Convocar", "Summon", "Chama à distância alguém em quem usou Presença; a pessoa vem até você."),
                            p(5, "Majestade", "Majesty", "Presença avassaladora: ninguém ousa atacá-lo ou contrariá-lo."),
                            p(5, "Magnetismo Estelar", "Star Magnetism", "O efeito de Presença alcança até por mídia e transmissões."))),
            new DisciplineInfo("Proteanismo",
                    "Mudança de forma: garras, formas bestiais e fusão com a terra.",
                    List.of(p(1, "Olhos da Besta", "Eyes of the Beast", "Olhos da Besta: enxerga no escuro total e intimida."),
                            p(1, "Peso da Pluma", "Weight of the Feather", "Torna-se leve como pluma, ignorando quedas e pressão."),
                            p(2, "Armas Ferais", "Feral Weapons", "Faz crescer garras que causam dano agravado."),
                            p(3, "Fundir-se à Terra", "Earth Meld", "Funde-se ao solo para descansar protegido dentro da terra."),
                            p(3, "Mudança de Forma", "Shapechange", "Assume a forma de um animal (lobo, morcego, etc.)."),
                            p(4, "Metamorfose", "Metamorphosis", "Assume formas maiores ou mais monstruosas."),
                            p(5, "Forma de Névoa", "Mist Form", "Vira névoa: imune a dano físico e capaz de passar por frestas."),
                            p(5, "O Coração Livre", "The Unfettered Heart", "O coração se desloca, tornando o estaqueamento muito mais difícil."))),
            new DisciplineInfo("Feitiçaria de Sangue",
                    "Magia do sangue (exclusiva de alguns clãs); além dos poderes, há rituais.",
                    List.of(p(1, "Vitae Corrosivo", "Corrosive Vitae", "Torna o próprio sangue corrosivo, capaz de derreter matéria."),
                            p(1, "Gosto pelo Sangue", "A Taste for Blood", "Ao provar o sangue de alguém, lê dados sobre ele (geração, ressonância, etc.)."),
                            p(2, "Extinguir Vitae", "Extinguish Vitae", "Força um Rouse Check extra na vítima, esgotando o sangue dela e elevando a Fome."),
                            p(3, "Sangue de Potência", "Blood of Potency", "Eleva temporariamente a própria Potência de Sangue."),
                            p(3, "Toque do Escorpião", "Scorpion's Touch", "Transforma o vitae em veneno paralisante, por toque ou lâmina."),
                            p(4, "Roubo de Vitae", "Theft of Vitae", "Drena o sangue da vítima à distância, num jorro pelo ar."),
                            p(5, "Carícia de Baal", "Baal's Caress", "Torna o sangue um veneno que causa dano agravado."),
                            p(5, "Caldeirão de Sangue", "Cauldron of Blood", "Ferve o sangue dentro da vítima, causando dano agravado intenso."))),
            new DisciplineInfo("Alquimia de Sangue-Ralo",
                    "Fórmulas alquímicas dos sangues-ralos (níveis = potência da fórmula).",
                    List.of(p(1, "Alcance Distante", "Far Reach", "Telecinese: move e puxa objetos ou pessoas à distância."),
                            p(1, "Névoa", "Haze", "Cria uma névoa que obscurece a área."),
                            p(2, "Envolver", "Envelop", "A névoa envolve e sufoca um alvo."),
                            p(2, "Hieros Gamos Profano", "Profane Hieros Gamos", "Ritual alquímico que troca temporariamente de corpo/aparência com outra pessoa."),
                            p(3, "Desfracionar", "Defractionate", "Torna sangue armazenado/fracionado bebível de novo para vampiros."),
                            p(4, "Ímpeto Aéreo", "Airborne Momentum", "Concede a si mesmo a capacidade de voar ou planar."),
                            p(5, "Despertar o Adormecido", "Awaken the Sleeper", "Desperta à força um vampiro em torpor ou em sono diurno."))));

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
