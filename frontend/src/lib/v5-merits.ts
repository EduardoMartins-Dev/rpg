/**
 * Vantagens (Antecedentes + Méritos) e Defeitos de Vampiro: A Máscara 5ª ed.
 *
 * Fonte única e SEGURA PARA CLIENTE (sem imports de servidor): o catálogo V5 do
 * servidor reexporta estes dados, e os componentes de ficha importam `meritDesc()`
 * para mostrar a descrição ao passar o mouse. As descrições (`desc`) são resumos
 * fiéis do Livro Básico (cap. Vantagens); `hint` traz a faixa de pontos.
 */

/** source: ausente = Livro Básico; "players_guide" = Guia do Jogador (V5 Players Guide). */
export type MeritOption = { name: string; group: string; hint?: string; desc: string; source?: "base" | "companion" | "players_guide" };

// Vantagens = Antecedentes + Méritos (e aprimoramentos de Refúgio/Máscara).
export const V5_ADVANTAGES: MeritOption[] = [
  // Antecedentes
  {
    name: "Aliados", group: "Antecedentes", hint: "1–6",
    desc: "Mortais que apoiam e ajudam você — família, amigos ou uma organização leal. Ajudam de boa vontade, mas têm as próprias vidas e limites; costumam aparecer cerca de uma vez por história. (Inimigo é o Defeito oposto.)",
  },
  {
    name: "Contatos", group: "Antecedentes", hint: "1–3",
    desc: "Pessoas (humanas) de diversos meios que fornecem informação em suas áreas e podem trocar favores. Ex.: despachante da polícia, colunista de fofocas, informante do submundo, repórter.",
  },
  {
    name: "Fama", group: "Antecedentes", hint: "1–5",
    desc: "Mortais conhecem seu nome e acompanham o que você faz. Cada ponto subtrai 1 da Dificuldade de testes Sociais contra fãs e de muitos testes de caça. Em troca, é mais difícil passar despercebido.",
  },
  {
    name: "Influência", group: "Antecedentes", hint: "1–5",
    desc: "Peso na comunidade mortal (dinheiro, prestígio, cargo político, chantagem, manipulação sobrenatural). Permite influenciar — e, em casos raros, controlar — a política e a sociedade da cidade, sobretudo a polícia e a burocracia.",
  },
  {
    name: "Refúgio", group: "Antecedentes", hint: "1–3",
    desc: "Abstrai o tamanho, a segurança e a privacidade do seu local de descanso. Cada ponto soma +1 à Dificuldade (ou +1 dado para resistir) contra quem tenta localizar, invadir ou vigiar seu refúgio, e +1 dado para perceber perigo enquanto está nele.",
  },
  {
    name: "Rebanho", group: "Antecedentes", hint: "1–5",
    desc: "Um grupo de vessels dos quais você se alimenta sem preocupação. Sacia por semana, sem rolagem, um número de pontos de Fome igual ao valor do Rebanho. Alimentar-se demais pode reduzir o Rebanho (membros morrem ou fogem).",
  },
  {
    name: "Máscara", group: "Antecedentes", hint: "1–2",
    desc: "Uma identidade falsa completa (documentos, contas, histórico) que sustenta sua farsa de humanidade. • passa numa checagem estadual; •• passa numa checagem da polícia nacional (FBI, Scotland Yard).",
  },
  {
    name: "Mawla", group: "Antecedentes", hint: "1–5",
    desc: "Um Membro (ou grupo) mais experiente que cuida de você, oferecendo orientação, informação ou ajuda de vez em quando. Pode agir como mentor, mas espera reciprocidade. (Adversário é o Defeito oposto.)",
  },
  {
    name: "Recursos", group: "Antecedentes", hint: "1–5",
    desc: "Renda e bens que sustentam seu padrão de não-vida — nem sempre líquidos (imóveis, arte, ouro, armas). É preciso detalhar a origem; podem secar, ser roubados ou sumir durante a crônica.",
  },
  {
    name: "Lacaios", group: "Antecedentes", hint: "1–3",
    desc: "Um ou mais servos leais (ghouls vinculados, dominados ou subjugados por Presença) que agem por você. Precisam ser controlados (salário, vitae, mesmerismo) e podem trair se o risco valer a pena ou se forem mal tratados.",
  },
  {
    name: "Status", group: "Antecedentes", hint: "1–5",
    desc: "Reputação e posição (merecida ou não) dentro de uma comunidade Membro local — Camarilla ou Anarquista. Status de uma seita não vale na outra, e em outra cidade cai 1 ponto.",
  },
  // Méritos — Aparência
  {
    name: "Belo", group: "Aparência", hint: "2",
    desc: "Você soma +1 dado em todas as paradas Sociais apropriadas.",
  },
  {
    name: "Deslumbrante", group: "Aparência", hint: "4",
    desc: "Você soma +2 dados em todas as paradas Sociais apropriadas.",
  },
  // Méritos — Linguística
  {
    name: "Linguística", group: "Linguística", hint: "1 idioma por ponto",
    desc: "Cada ponto permite falar, ler e escrever com fluência um idioma adicional, além do seu idioma natal e do idioma dominante da crônica (que todo personagem já domina).",
  },
  // Méritos — Uso de Substâncias
  {
    name: "Viciado Funcional", group: "Uso de Substâncias", hint: "1",
    desc: "Você tem vício em uma substância além do sangue. Ganha +1 dado em UMA categoria de parada (definida junto com a substância) quando a última pessoa de quem se alimentou estava sob efeito da droga.",
  },
  // Méritos — Vínculo de Sangue
  {
    name: "Resistência ao Vínculo", group: "Vínculo de Sangue", hint: "1–3",
    desc: "Seu Sangue se rebela contra o controle. +1 dado nas paradas para resistir a um Vínculo de Sangue por nível deste Mérito (máximo 3).",
  },
  {
    name: "Vínculo Curto", group: "Vínculo de Sangue", hint: "2",
    desc: "Vínculos de Sangue sobre você enfraquecem mais rápido que o normal: perdem 1 de força na lua cheia e na lua nova (ou seja, 2 por mês) se não forem reforçados.",
  },
  {
    name: "Inligável", group: "Vínculo de Sangue", hint: "5",
    desc: "Você não pode ser preso por um Vínculo de Sangue. Se ficar sem dinheiro, ainda pode vender seu vitae a alquimistas.",
  },
  // Méritos — Alimentação
  {
    name: "Sabujo", group: "Alimentação", hint: "1",
    desc: "Você sente a Ressonância do sangue de um humano pelo olfato, sem precisar prová-lo. É preciso estar ao alcance do cheiro; teste de Determinação + Percepção, Dificuldade 3 (pior com perfume/distância, melhor com contato íntimo).",
  },
  {
    name: "Estômago de Ferro", group: "Alimentação", hint: "3",
    desc: "Você consegue se alimentar de sangue frio, rançoso e de plasma fracionado (nenhum fornece Ressonância). Ventrue não podem ter este Mérito.",
  },
  // Méritos — Míticos
  {
    name: "Comer Comida", group: "Míticos", hint: "2",
    desc: "Você consegue consumir comida — e até apreciá-la —, mas ela não alimenta e precisa ser expelida antes de descansar durante o dia.",
  },
  // Aprimoramentos de Refúgio (somam ao valor-base do Refúgio)
  {
    name: "Arsenal Oculto", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Cada ponto adiciona um conjunto de armas ao refúgio (uma pistola e uma arma longa, com munição), tão escondidas quanto o seu local de descanso.",
  },
  {
    name: "Cela", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Um espaço trancado para guardar 2 prisioneiros (Dificuldade de fuga base 5). Cada ponto extra dobra a capacidade (até 32) ou soma +1 à Dificuldade de fuga. Indisponível em refúgios pequenos.",
  },
  {
    name: "Guardas", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Cada ponto fornece 4 guardas Médios e 1 chefe Talentoso protegendo o refúgio (segurança privada ou capangas). Compre com cautela onde guardas chamem atenção.",
  },
  {
    name: "Laboratório", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Um laboratório equipado. Cada ponto soma +1 dado a rolagens de uma especialidade de Ciência ou Tecnologia (ou de Alquimia pelo método Fixatio). Indisponível em refúgios pequenos.",
  },
  {
    name: "Biblioteca", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Uma biblioteca dedicada (ocultismo, lendas Cainitas, história da cidade...). Cada ponto soma +1 dado em pesquisas de uma especialidade de Erudição, Investigação ou Ocultismo. Refúgios pequenos: no máx. 1 ponto.",
  },
  {
    name: "Localização", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Seu refúgio fica numa área nobre ou exclusiva da cidade. Concede +2 dados (ou +2 na Dificuldade dos inimigos) a rolagens ligadas ao Chasse ou ao valor-base do Refúgio (escolha uma).",
  },
  {
    name: "Luxo", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Detalhes caros (telas de alta definição, mobília de grife, obras de arte). +2 dados em testes Sociais com convidados mortais no refúgio. Sem ao menos Recursos •••, a decoração foi obtida ilegalmente.",
  },
  {
    name: "Saída Secreta", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Uma saída dos fundos, túnel secreto ou passagem discreta. Cada ponto soma +1 dado às paradas para evadir ou escapar de vigilância perto do refúgio.",
  },
  {
    name: "Sistema de Segurança", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Um sistema de segurança acima da média. Cada ponto soma +1 dado à parada para resistir a (ou ser alertado sobre) entradas não autorizadas no refúgio.",
  },
  {
    name: "Sala Cirúrgica", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Um cômodo equipado como cirurgia de campo (ou melhor). +2 dados a rolagens relevantes (em geral Medicina) feitas no refúgio. Indisponível em refúgios pequenos.",
  },
  {
    name: "Proteção Mágica", group: "Refúgio · aprimoramentos", hint: "por ponto",
    desc: "Alguma proteção mágica que barra forças sobrenaturais (você mesmo consegue passar). Cada ponto soma +1 dado para resistir a espionagem sobrenatural (scrying) e afins. O Narrador pode exigir Ocultismo 3+ ou Feitiçaria de Sangue.",
  },
  // Aprimoramentos de Máscara (exigem Máscara ••)
  {
    name: "Zerado", group: "Máscara · aprimoramentos", hint: "1 · requer Máscara ••",
    desc: "Alguém em altos cargos apagou seus registros reais. Oficialmente, você não existe.",
  },
  {
    name: "Falsário", group: "Máscara · aprimoramentos", hint: "1 · requer Máscara ••",
    desc: "Você consegue fabricar ou conseguir Máscaras. Fabricar leva 3 dias por ponto (e pode te expor online); conseguir leva 1 dia por ponto, mas cobra algo em troca.",
  },
  // --- Players Guide (Guia do Jogador) ---
  {
    name: "Segredos da Cidade", group: "Antecedentes", hint: "1–3", source: "players_guide",
    desc: "Você guarda um segredo comprometedor sobre a estrutura de poder Membro da cidade. Funciona como proteção (quem quer o segredo enterrado te mantém bem) e, às vezes, como Influência. Pode ser adquirido até 3 vezes, um segredo diferente por vez.",
  },
  {
    name: "Rosto Famoso", group: "Aparência", hint: "1", source: "players_guide",
    desc: "Você é muito parecido com alguém famoso. +2 dados em testes Sociais quando dá para usar a semelhança a seu favor — mas −2 para se esconder na multidão ou evitar ser reconhecido.",
  },
  {
    name: "Ingênuo", group: "Aparência", hint: "1", source: "players_guide",
    desc: "Você parece inocente e incapaz de fazer mal, e os outros acreditam nas suas boas intenções com mais facilidade. +2 dados para evitar suspeita ou desviar a culpa, a critério do Narrador.",
  },
  {
    name: "Traço Marcante", group: "Aparência", hint: "1", source: "players_guide",
    desc: "Você tem um traço raro e memorável (cor de olhos incomum, pupilas atípicas, tez singular...). +2 dados em interações sociais com estranhos (a novidade logo passa), mas −1 para se disfarçar.",
  },
  {
    name: "Reconhecer Vessel", group: "Alimentação", hint: "1", source: "players_guide",
    desc: "Você aprendeu a farejar de quem NÃO se alimentar. Determinação + Prontidão (Dif 2) revela se um mortal foi drenado recentemente; num crítico, percebe se a alimentação é recorrente (provável rebanho ou Boneca de Sangue de alguém).",
  },
  {
    name: "Sorte do Diabo", group: "Míticos", hint: "4", source: "players_guide",
    desc: "Sempre há alguém para pagar o pato por você. 1x por sessão, um infortúnio dirigido a você (um ataque, uma acusação, uma culpa) recai sobre alguém próximo — aliado, lacaio, membro da coterie ou até um Pilar.",
  },
  {
    name: "Modo Nuit", group: "Míticos", hint: "2", source: "players_guide",
    desc: "Seu corpo não volta ao estado de morte toda noite: cortes de cabelo, tatuagens e outras modificações permanecem (você ainda pode revertê-las, curando-as como dano Agravado). Só para Potência de Sangue 1 ou menor.",
  },
  {
    name: "Olhar no Porta-Malas", group: "Outros", hint: "1", source: "players_guide",
    desc: "Você mantém um arsenal/caixa de ferramentas à mão (nada acima de Recursos 2: espingarda serrada, alicate, fita, estacas caseiras...). +2 dados em paradas de Preparação para itens dessa faixa. Perder o carro/refúgio pode interromper o Mérito até reconstruir o estoque.",
  },
  {
    name: "Bico", group: "Outros", hint: "2", source: "players_guide",
    desc: "Você vive de virações e favores. 1x por sessão, consegue um item, uma informação ou acesso como se tivesse 2 pontos no Antecedente apropriado (Recursos, Contatos ou Influência) — geralmente cobrando favores da sua rede informal.",
  },
  {
    name: "Vontade Temperada", group: "Outros", hint: "3", source: "players_guide",
    desc: "Você sempre percebe quando tentam te forçar com Dominação ou Presença. 1x por sessão, ao resistir a Dominação ou Presença, +2 dados na parada de resistência. Só para quem tem 0 em Dominação E em Presença.",
  },
  {
    name: "Intocável", group: "Outros", hint: "5", source: "players_guide",
    desc: "Os poderosos relutam em te punir. 1x por história, escapa de toda punição oficial por um crime que normalmente te destruiria ou exilaria da seita (ainda pode haver represálias por vias informais).",
  },
  // --- Players Guide · Méritos de Caitiff ---
  {
    name: "Sangue Favorecido", group: "Caitiff", hint: "4", source: "players_guide",
    desc: "Só para Caitiff. Pode comprar pontos em qualquer Disciplina mesmo sem nunca ter provado o sangue de um vampiro dela. Não combina com o Defeito Sangue Confuso.",
  },
  {
    name: "Marca de Caim", group: "Caitiff", hint: "2", source: "players_guide",
    desc: "Só para Caitiff. Uma marca (física ou espiritual) que impõe respeito: +2 dados para intimidar/coagir vampiros que creem no mito de Caim; quem tenta diablerie em você não soma a Potência de Sangue e qualquer falha vira falha bestial.",
  },
  {
    name: "Pássaro Imitador", group: "Caitiff", hint: "3", source: "players_guide",
    desc: "Só para Caitiff. Após beber 1 dado de Fome do sangue de um vampiro, por uma noite pode usar UM poder de Disciplina dele (de nível até sua maior Disciplina), sofrendo o bane de clã do doador enquanto isso. Um poder emprestado por noite.",
  },
  {
    name: "Marcado pelo Sol", group: "Caitiff", hint: "5", source: "players_guide",
    desc: "Só para Caitiff. Raro Andarilho Diurno: no 1º turno exposto ao sol numa cena não sofre dano de Vitalidade, leva 1 de Agravado de FdV e passa automático em testes de frenesi de terror; pelo resto da cena, todo Agravado de sol vira Superficial.",
  },
  {
    name: "Tio Presas", group: "Caitiff", hint: "3", source: "players_guide",
    desc: "Só para Caitiff. Os sangues-fracos locais te veem como mentor: acesso fácil a uma coterie de 3–5 deles (como um grupo de Aliados, porém mortos-vivos). Não combina com o Defeito Liquidante.",
  },
  // --- Players Guide · Méritos de Sangue-Fraco (sem custo em pontos) ---
  {
    name: "Sangue Repugnante", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Seu sangue enoja outros vampiros: eles vomitam e abortam a mordida após o dano inicial, e quem insiste em beber gasta 2 de Força de Vontade por turno. Não afeta mortais nem a Alquimia.",
  },
  {
    name: "À Prova de Fé", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você está perto demais da mortalidade para ser afetado pela Fé Verdadeira.",
  },
  {
    name: "Pouco Apetite", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Com Fome 0 ou 1, ao subir a Fome no anoitecer, role dois dados no Rouse Check e fique com o melhor.",
  },
  {
    name: "Sonhador Lúcido", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você sonha e pode controlar os sonhos: 1x por sessão, dormindo de dia, pode pedir ao Narrador uma pista das memórias da noite anterior ou da trama.",
  },
  {
    name: "Semblante Mortal", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Sua aura parece mortal, não vampírica, para quem detecta o sobrenatural; +2 dados para parecer mortal por outros meios (maquiagem etc.).",
  },
  {
    name: "Bebedor Ágil", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você bebe com delicadeza: sacia 1 de Fome em um turno e lambe a ferida, fechando-a. Uma vez por cena.",
  },
  // --- Players Guide · Méritos de Carniçal ---
  {
    name: "Empatia de Sangue", group: "Carniçal", hint: "2", source: "players_guide",
    desc: "Só para carniçais. Sente o estado emocional/psicológico do seu domitor à distância (até ~1,6 km), mesmo sem estar presente — percebe se ele corre perigo ou precisa de você. Não é telepatia; o domitor é aquele cujo sangue você bebeu por último.",
  },
  {
    name: "Aura Imprópria", group: "Carniçal", hint: "2", source: "players_guide",
    desc: "Só para carniçais. Sua aura ficou abafada, quase indistinguível da de um Membro; pode fazer os outros te superestimarem — ou gerar situações constrangedoras.",
  },
];

// Defeitos, agrupados pelo Antecedente/Mérito de onde derivam.
export const V5_FLAWS: MeritOption[] = [
  // Antecedentes
  {
    name: "Inimigo", group: "Antecedentes", hint: "1+",
    desc: "Um mortal (ou grupo) que age contra você — o oposto de Aliados. Aparece pelo menos uma vez por história, sempre que o Narrador achar oportuno. Como Defeito, vale 2 pontos a menos que o Aliado equivalente.",
  },
  {
    name: "Adversário", group: "Antecedentes", hint: "1–5",
    desc: "Um outro Cainita (ou cabala) que deseja o mal a você, seu senhor ou linhagem — o oposto de Mawla. Vai de • Neonato a ••••• Príncipe/Barão.",
  },
  {
    name: "Segredo Sombrio", group: "Antecedentes", hint: "1",
    desc: "Versão mais branda da Infâmia: seus atos sombrios são conhecidos só por você e talvez um ou dois inimigos muito motivados. Ex.: diabolista, açougueiro (Cleaver), quebrador reincidente da Máscara.",
  },
  {
    name: "Infâmia", group: "Antecedentes", hint: "1–2",
    desc: "Você é famoso por algo horrível. No mínimo, a Dificuldade da maioria dos testes de reação aumenta pelo valor do Defeito; no pior caso, as autoridades tentam matar ou capturar você sempre que aparece.",
  },
  {
    name: "Malvisto", group: "Antecedentes", hint: "1",
    desc: "Você subtrai 1 dado das paradas de testes Sociais com qualquer grupo da cidade, exceto seus Contatos, Aliados e apoiadores explicitamente leais.",
  },
  {
    name: "Desprezado", group: "Antecedentes", hint: "2",
    desc: "Um grupo ou região da cidade vive para atrapalhar você e sua facção. −2 dados nas paradas para convencer um ator neutro a apoiá-lo politicamente ou lhe fazer um favor.",
  },
  {
    name: "Predador Óbvio", group: "Antecedentes", hint: "2",
    desc: "Você exala um ar predatório, e humanos instintivamente temem e desconfiam de você. −2 dados em qualquer parada de caça (exceto perseguir/matar fisicamente) e −1 em testes Sociais para deixar humanos à vontade. Não pode manter um Rebanho.",
  },
  {
    name: "Miserável", group: "Antecedentes", hint: "1",
    desc: "Você não tem dinheiro nem lar.",
  },
  {
    name: "Perseguidores", group: "Antecedentes", hint: "1",
    desc: "Você tende a atrair gente obcecada por você. Um ex-lacaio guarda a lembrança e o desejo de reatar (faminto, apaixonado, desesperado...). Se você se livrar de um, logo aparece outro.",
  },
  {
    name: "Suspeito", group: "Antecedentes", hint: "1",
    desc: "Você está muito mal com esta seita (furou um favor, quebrou um juramento...). −2 dados em todos os testes Sociais com a facção ofendida, até reparar o dano. (Caitiff começam com este Defeito.)",
  },
  {
    name: "Rejeitado", group: "Antecedentes", hint: "2",
    desc: "Você é completamente odiado por esta seita — traiu, enfrentou ou cruzou um líder local. Seus membros trabalharão ativamente contra você sempre que puderem.",
  },
  // Refúgio
  {
    name: "Sem Refúgio", group: "Refúgio", hint: "1",
    desc: "Você precisa se esforçar (ao menos um teste básico) para achar um novo local de descanso toda manhã.",
  },
  {
    name: "Assombrado", group: "Refúgio", hint: "1",
    desc: "Há no seu refúgio uma manifestação sobrenatural que você não controla nem entende de verdade (um fantasma, um portal, um meteorito amaldiçoado...). Impõe ao menos −1 dado por ponto às paradas afetadas no refúgio e pode ser usada por quem a compreende para burlar sua segurança.",
  },
  {
    name: "Sinistro", group: "Refúgio", hint: "1",
    desc: "Seu refúgio parece o covil de um serial killer — o que, convenhamos, é provavelmente o que é. Vizinhos podem denunciar; −2 dados em testes Sociais para seduzir ou deixar convidados humanos à vontade ali.",
  },
  {
    name: "Comprometido", group: "Refúgio", hint: "2",
    desc: "Seu refúgio já foi invadido uma vez e provavelmente consta na lista de alguém. Invasores ou espiões somam +2 dados para penetrá-lo ou vigiá-lo.",
  },
  // Máscara
  {
    name: "Cadáver Conhecido", group: "Máscara", hint: "1",
    desc: "As pessoas sabem que você morreu recentemente e reagem com choque e horror se você aparece entre elas. Também atrapalha qualquer busca sobre sua identidade em bancos de dados.",
  },
  {
    name: "Blankbody Conhecido", group: "Máscara", hint: "2",
    desc: "Sua biometria, nome, histórico, associados e codinomes aparecem em bancos de várias agências de inteligência, marcados como possível terrorista. Qualquer inquisidor lê nas entrelinhas e reconhece você como vampiro.",
  },
  // Aparência
  {
    name: "Feio", group: "Aparência", hint: "1",
    desc: "Você perde 1 dado de todas as paradas Sociais relevantes.",
  },
  {
    name: "Repulsivo", group: "Aparência", hint: "2",
    desc: "Você perde 2 dados de todas as paradas Sociais apropriadas.",
  },
  // Uso de Substâncias
  {
    name: "Vício", group: "Uso de Substâncias", hint: "1",
    desc: "Você é viciado numa substância além do sangue e busca vítimas sob efeito dela. Perde 1 dado de todas as paradas quando a última pessoa de quem se alimentou não estava sob a droga — exceto paradas de ações que vão obter a droga de imediato.",
  },
  {
    name: "Vício Incurável", group: "Uso de Substâncias", hint: "2",
    desc: "Vício grave e praticamente impossível de largar. Perde 2 dados de todas as paradas quando a última pessoa de quem se alimentou não estava sob a droga — exceto paradas de ações que vão obter a droga de imediato.",
  },
  // Arcaico
  {
    name: "Vivendo no Passado", group: "Arcaico", hint: "1",
    desc: "Você não assimilou (ou não quer assimilar) a mentalidade moderna. Tem Convicções seriamente ultrapassadas; perde 1 dado em testes Sociais que envolvam essas crenças arcaicas — exceto com vampiros da sua idade ou mais velhos, que podem admirar sua firmeza. (Só ancillae ou mais velhos.)",
  },
  {
    name: "Arcaico", group: "Arcaico", hint: "2",
    desc: "Você não conseguiu se adaptar ao presente (ou passou tempo demais em torpor). Não sabe usar computadores nem celulares e sua Tecnologia é permanentemente 0; o Narrador pode penalizar em 1 dado outras paradas com tecnologia muito moderna. (Só ancillae ou mais velhos.)",
  },
  // Vínculo de Sangue
  {
    name: "Viciado em Vínculo", group: "Vínculo de Sangue", hint: "1",
    desc: "O Vínculo fica mais doce para você depois que se forma. Subtraia 1 dado das suas paradas para agir contra um Vínculo de Sangue.",
  },
  {
    name: "Vínculo Longo", group: "Vínculo de Sangue", hint: "1",
    desc: "Vínculos de Sangue sobre você perdem força mais devagar que o normal: caem 1 ponto a cada três meses sem reforço.",
  },
  {
    name: "Escravo do Vínculo", group: "Vínculo de Sangue", hint: "2",
    desc: "Você se vincula na hora, ao primeiro gole do vitae de outro (uma dose basta, não três). Ou começa como escravo do seu senhor, ou combine com o Narrador por que esse primeiro vínculo se quebrou.",
  },
  // Alimentação
  {
    name: "Presa Restrita", group: "Alimentação", hint: "1",
    desc: "Você se recusa a caçar certa categoria de presa (usuários de drogas, mulheres, crianças, policiais, inocentes, uma etnia...). Se se alimentar dessa presa, ganha Manchas como se tivesse violado um Preceito. Ventrue ganham uma restrição extra.",
  },
  {
    name: "Sede de Matusalém", group: "Alimentação", hint: "1",
    desc: "Sua Fome só é plenamente saciada por sangue de criaturas sobrenaturais. Do contrário, permanece no mínimo em 1 (ou mais, conforme a Potência de Sangue). Alquimistas podem engrossar o sangue de sangues-fracos o bastante para saciar você.",
  },
  {
    name: "Organívoro", group: "Alimentação", hint: "2",
    desc: "Você só sacia a Fome comendo carne e órgãos humanos, sobretudo os ricos em sangue (coração, fígado, pulmões, baço...). Apenas o coração fornece Ressonância, quando fornece.",
  },
  {
    name: "Vegano", group: "Alimentação", hint: "2",
    desc: "Você se alimenta apenas de sangue animal. Para beber sangue humano precisa gastar 2 pontos de Força de Vontade. Ventrue não podem ter este Defeito.",
  },
  // Míticos
  {
    name: "Perdição Folclórica", group: "Míticos", hint: "1",
    desc: "Você sofre dano Agravado de uma perdição folclórica — p. ex.: luz ultravioleta (dano como luz solar), prata (dano como a arma; só encostar numa moeda de prata já causa 1 de Agravado) ou água benta (dano como fogo).",
  },
  {
    name: "Bloqueio Folclórico", group: "Míticos", hint: "1",
    desc: "Diante de um bloqueio folclórico, você precisa recuar dele ou gastar 1 ponto de Força de Vontade para atravessá-lo. Ex.: símbolos sagrados apresentados por um crente, água corrente visível, cruzar a soleira de uma casa sem convite, alho, rosas silvestres, sementes espalhadas não contadas. Cada bloqueio conta como um Defeito de 1 ponto à parte.",
  },
  {
    name: "Estigma", group: "Míticos", hint: "1",
    desc: "Ao chegar à Fome 4, você passa a sangrar por feridas abertas nas mãos, nos pés e na testa. Isso chama atenção, deixa vestígios e pode penalizar algumas paradas, a critério do Narrador.",
  },
  {
    name: "Isca de Estaca", group: "Míticos", hint: "2",
    desc: "Ao ser estaqueado no coração, em vez de entrar em torpor você sofre a Morte Final.",
  },
  // Linguística
  {
    name: "Analfabeto", group: "Linguística", hint: "2",
    desc: "Você não sabe ler nem escrever. Suas perícias Erudição e Ciência ficam limitadas a 1, e você não pode ter nelas especialidades que envolvam conhecimento moderno.",
  },
  // --- Players Guide (Guia do Jogador) ---
  {
    name: "Fedor", group: "Aparência", hint: "1", source: "players_guide",
    desc: "Seu hálito e odor são sobrenaturalmente pútridos (cheiro de cova aberta e carne podre); até Nosferatu torcem o nariz. −1 dado em sedução e Sociais afins, e −2 em Furtividade contra quem sente cheiro — a menos que você esteja a favor do vento.",
  },
  {
    name: "Transparente", group: "Aparência", hint: "1", source: "players_guide",
    desc: "Você é um péssimo mentiroso — cara de paisagem impossível. −1 dado em qualquer parada que exija Subterfúgio, e você não pode ganhar pontos em Subterfúgio.",
  },
  {
    name: "Sugador Furtivo", group: "Alimentação", hint: "1", source: "players_guide",
    desc: "A alimentação é íntima demais para você: não consegue tirar sangue de um mortal sendo observado. Costuma se alimentar de desavisados ou de vítimas drogadas/inconscientes.",
  },
  {
    name: "Decadência Faminta", group: "Míticos", hint: "2", source: "players_guide",
    desc: "Seu corpo vive à beira de apodrecer; só a Fome o segura. Com Fome 3 ou mais, ele murcha: −2 dados em testes físicos e em interações sociais com mortais, além de risco à Máscara.",
  },
  {
    name: "Duas Vezes Amaldiçoado", group: "Míticos", hint: "2", source: "players_guide",
    desc: "Você carrega um Bane a mais: sofre o Bane variante do seu clã ALÉM do Bane normal. O Narrador pode vetar se o segundo Bane não fizer sentido (ou não pesar) na crônica.",
  },
  {
    name: "Faminto por Conhecimento", group: "Outros", hint: "1", source: "players_guide",
    desc: "Escolha um tema que seu personagem anseia estudar. Ao topar com livros, aulas ou vídeos sobre ele, role Força de Vontade (Dif 3) para não largar tudo e mergulhar no assunto.",
  },
  {
    name: "Dívidas de Prestígio", group: "Outros", hint: "1", source: "players_guide",
    desc: "Você deve dois favores menores (boons) a outro Membro. Enquanto a dívida existir, ele tem +1 dado em conflitos sociais contra você e pode cobrá-la na pior hora possível.",
  },
  {
    name: "Aventureiro Imprudente", group: "Outros", hint: "1", source: "players_guide",
    desc: "Você se sente compelido a viver cada novo risco. Diante de uma tentação arriscada inédita (uma droga nova, sangue de vampiro, um amante Membro), −2 dados em tudo até você ceder ou a cena acabar. Não te leva ao suicídio, mas você nem sempre mede as consequências.",
  },
  {
    name: "Fraco de Vontade", group: "Outros", hint: "2", source: "players_guide",
    desc: "Você custa a impor a própria vontade diante da de outro. −1 dado em paradas Sociais contra seu líder ou superior; e, mesmo ciente de uma tentativa de Dominação ou Presença, não pode usar a resistência ativa contra ela.",
  },
  // --- Players Guide · Defeitos de Caitiff ---
  {
    name: "Vitae Corrompido", group: "Caitiff", hint: "2", source: "players_guide",
    desc: "Só para Caitiff. Todo mortal que você Abraça ou mata se alimentando volta como um wight (morto faminto) em poucas noites — e o Príncipe/Barão pode te visitar por causa disso.",
  },
  {
    name: "Maldição de Clã", group: "Caitiff", hint: "2", source: "players_guide",
    desc: "Só para Caitiff. Você sofre o bane de um clã à sua escolha (geralmente o do seu senhor), com Gravidade da Perdição pela metade (mín. 1).",
  },
  {
    name: "Servo por Dívida", group: "Caitiff", hint: "2", source: "players_guide",
    desc: "Só para Caitiff. Você deve vários favores (boons) a um vampiro de Status alto; ele tem +2 dados em conflitos sociais contra você e nunca considera a dívida quitada. Recusar pagar adiciona o Defeito Rejeitado.",
  },
  {
    name: "Liquidante", group: "Caitiff", hint: "1", source: "players_guide",
    desc: "Só para Caitiff. Os sangues-fracos te chamam de 'alcoviteiro' e te evitam: −2 dados em testes Sociais com eles (exceto Intimidação). Não combina com Tio Presas.",
  },
  {
    name: "Sangue Confuso", group: "Caitiff", hint: "1", source: "players_guide",
    desc: "Só para Caitiff. Seu Sangue não recorda a própria natureza: mesmo já tendo uma Disciplina, precisa beber o sangue de quem a possui para comprar pontos nela. Não combina com Sangue Favorecido.",
  },
  {
    name: "Presságio Ambulante", group: "Caitiff", hint: "2", source: "players_guide",
    desc: "Só para Caitiff. Toda premonição, scrying ou adivinhação no domínio aponta você como fonte de desastre e desgraça — oráculos te apontam mesmo sem estarem te procurando.",
  },
  // --- Players Guide · Defeitos de Sangue-Fraco (sem custo em pontos) ---
  {
    name: "Heliofobia", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você teme o sol como um vampiro pleno: está sujeito a frenesi de terror diante da luz solar.",
  },
  {
    name: "Terrores Noturnos", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Seus sonhos voltam como pesadelos nas piores horas: 1x por sessão, sob estresse, −1 dado em todas as ações pelo resto da cena.",
  },
  {
    name: "Portador de Pragas", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você ainda pega doenças mortais: a cada Fome saciada, role 1 dado — se cair 1, contraiu algo (e pode infectar de quem se alimentou). Só cura saciando a Fome até 0.",
  },
  {
    name: "Bebedor Desleixado", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Sua mordida é grosseira: ao se alimentar, teste Destreza + Medicina (Dif = Fome saciada) para fechar as marcas; falhando, a vítima pode sangrar até morrer, com ferimentos que ameaçam a Máscara.",
  },
  {
    name: "Apagado pelo Sol", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você não usa Disciplinas (nem Alquimia) sob o sol, e poderes ativos cessam ao entrar nele; à luz do dia em ambiente fechado, usa-os com −2 dados, desde que evite qualquer réstia de sol.",
  },
  {
    name: "Estigma Sobrenatural", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Algo em você (cheiro, aura) denuncia sua presença a outros seres sobrenaturais: −2 dados em Furtividade e afins contra oponentes sobrenaturais, incluindo vampiros.",
  },
  {
    name: "Presença Crepuscular", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Você incomoda: mortais não querem chegar perto e Membros gostam ainda menos de você que dos outros sangue-fracos. −1 dado em testes Sociais com qualquer um que não seja sangue-fraco.",
  },
  {
    name: "Fome Sem Fim", group: "Sangue-Fraco", hint: "—", source: "players_guide",
    desc: "Só para sangue-fraco. Sua Besta sempre quer mais: ao se alimentar numa cena, sacia 1 de Fome a menos que os outros sangue-fracos. Uma vez por cena.",
  },
  // --- Players Guide · Defeitos de Carniçal ---
  {
    name: "Sangue Nefasto", group: "Carniçal", hint: "1–2", source: "players_guide",
    desc: "Só para carniçais. Você sofre o bane do clã do seu primeiro domitor (Lasombra, Malkavian, Ministry, Nosferatu, Ravnos, Salubri ou Toreador), em um nível por ponto do Defeito. Trocar de domitor não muda o bane.",
  },
  {
    name: "Maldição da Anciã", group: "Carniçal", hint: "2", source: "players_guide",
    desc: "Só para carniçais. Ao beber o vitae do domitor, você envelheceu rápido: aparenta pelo menos uma década a mais e tem 1 caixa a menos na trilha de Vitalidade. O Abraço anula este Defeito.",
  },
  {
    name: "Presas Perturbadoras", group: "Carniçal", hint: "1", source: "players_guide",
    desc: "Só para carniçais. O Sangue te deu presas estranhas e curtas que incomodam quem as percebe: −1 dado em testes Sociais com mortais.",
  },
];

// Busca por nome (tolerante a acentuação/caixa/espaços) → descrição do livro.
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

const BY_NAME = new Map<string, MeritOption>();
for (const m of [...V5_ADVANTAGES, ...V5_FLAWS]) BY_NAME.set(norm(m.name), m);

/** Descrição oficial de uma Vantagem/Defeito, ou undefined se desconhecida. */
export function meritDesc(name: string): string | undefined {
  return BY_NAME.get(norm(name))?.desc;
}

/** Origem de uma Vantagem/Defeito ("players_guide", "companion"...), ou undefined. */
export function meritSource(name: string): MeritOption["source"] {
  return BY_NAME.get(norm(name))?.source;
}
