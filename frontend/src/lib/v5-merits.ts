/**
 * Vantagens (Antecedentes + Méritos) e Defeitos de Vampiro: A Máscara 5ª ed.
 *
 * Fonte única e SEGURA PARA CLIENTE (sem imports de servidor): o catálogo V5 do
 * servidor reexporta estes dados, e os componentes de ficha importam `meritDesc()`
 * para mostrar a descrição ao passar o mouse. As descrições (`desc`) são resumos
 * fiéis do Livro Básico (cap. Vantagens); `hint` traz a faixa de pontos.
 */

export type MeritOption = { name: string; group: string; hint?: string; desc: string };

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
];

// Busca por nome (tolerante a acentuação/caixa/espaços) → descrição do livro.
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

const BY_NAME = new Map<string, MeritOption>();
for (const m of [...V5_ADVANTAGES, ...V5_FLAWS]) BY_NAME.set(norm(m.name), m);

/** Descrição oficial (Livro Básico) de uma Vantagem/Defeito, ou undefined se desconhecida. */
export function meritDesc(name: string): string | undefined {
  return BY_NAME.get(norm(name))?.desc;
}
