// Índice de magias do Tormenta 20 (livro básico), extraído da seção "Descrição das
// magias". 167 magias com tradição, círculo, escola, parâmetros de execução e um
// resumo de uma linha. Gerado a partir do PDF; descrições completas ficam para depois.

export type Spell = {
  name: string; tradition: "Arcana" | "Divina"; circle: number;
  school: string; exec: string; summary: string;
};

export const SPELLS: Spell[] = [
  {
    "name": "Adaga Mental",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: instantânea; Resistência: Vontade parcial.",
    "summary": "Você manifesta e dispara uma adaga imaterial contra a mente do alvo, que sofre 2d6 pontos de dano psíquico e fica atordoado por uma rodada."
  },
  {
    "name": "Alarme",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: curto; Área: esfera com 9m de raio; Duração: 1 dia.",
    "summary": "Você cria uma barreira protetora invisível que detecta qualquer criatura que tocar ou entrar na área protegida."
  },
  {
    "name": "Amedrontar",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 animal ou humanoide; Duração: cena; Resistência: Vontade parcial.",
    "summary": "O alvo é envolvido por energias sombrias e assustadoras."
  },
  {
    "name": "Área Escorregadia",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Alvo ou Área: quadrado de 3m ou 1 objeto; Duração: cena; Resistência: Reflexos (veja texto).",
    "summary": "Esta magia recobre uma superfície com uma substância gordurosa e escorregadia."
  },
  {
    "name": "Armadura Arcana",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Esta magia cria uma película protetora invisível, mas tangível, fornecendo +5 na Defesa."
  },
  {
    "name": "Concentração de Combate",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Adivinhação",
    "exec": "Execução: livre; Alcance: pessoal; Alvo: você; Duração: 1 rodada.",
    "summary": "Você amplia sua percepção, antecipando movimentos dos inimigos e achando brechas em sua defesa."
  },
  {
    "name": "Conjurar Monstro",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: curto; Efeito: 1 criatura conjurada; Duração: sustentada.",
    "summary": "Você conjura um monstro Pequeno que ataca seus inimigos."
  },
  {
    "name": "Criar Ilusão",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: médio; Efeito: ilusão que se estende a até 4 cubos de 1,5m; Duração: cena; Resistência: Vontade desacredita.",
    "summary": "Esta magia cria uma ilusão visual (uma criatura, uma parede...) ou sonora (um grito de socorro, um uivo assustador...)."
  },
  {
    "name": "Disfarce Ilusório",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena; Resistência: Vontade desacredita.",
    "summary": "Você muda a aparência do alvo, incluindo seu equipamento."
  },
  {
    "name": "Enfeitiçar",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 humanoide; Duração: cena; Resistência: Vontade anula.",
    "summary": "O alvo fica enfeitiçado (veja a página 394)."
  },
  {
    "name": "Explosão de chamas",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 6m; Duração: instantânea; Resistência: Reflexos reduz à metade.",
    "summary": "Um leque de chamas irrompe de suas mãos, causando 2d6 pontos de dano de fogo às criaturas na área."
  },
  {
    "name": "Imagem Espelhada",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Três cópias ilusórias suas aparecem."
  },
  {
    "name": "Leque Cromático",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 4,5m; Duração: instantânea. Resistência: Vontade parcial.",
    "summary": "Um cone de luzes brilhantes surge das suas mãos, deixando os animais e humanoides na área atordoados por 1 rodada (apenas uma vez por cena, Vontade anula) e ofuscados pela cena."
  },
  {
    "name": "Primor Atlético",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Você modifica os limites físicos do alvo, que recebe deslocamento +9m e +10 em testes de Atletismo."
  },
  {
    "name": "Queda Suave",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: reação; Alcance: curto; Alvos: 1 criatura ou objeto Grande ou menor; Duração: até chegar ao solo ou cena, o que vier primeiro.",
    "summary": "O alvo cai lentamente."
  },
  {
    "name": "Raio do Enfraquecimento",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: cena; Resistência: Fortitude parcial.",
    "summary": "Você dispara um raio púrpura que drena as forças do alvo."
  },
  {
    "name": "Seta Infalível de Talude",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Alvos: criaturas escolhidas; Duração: instantânea.",
    "summary": "Favorita entre arcanistas iniciantes, esta magia lança duas setas de energia."
  },
  {
    "name": "Sono",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 humanoide; Duração: cena; Resistência: Vontade parcial.",
    "summary": "Um cansaço místico recai sobre o alvo."
  },
  {
    "name": "Teia",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Área: cubo com 6m de lado; Duração: cena; Resistência: Reflexos anula.",
    "summary": "Teia cria várias camadas de fibras entrelaçadas e pegajosas na área."
  },
  {
    "name": "Toque Chocante",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea; Resistência: Fortitude reduz à metade.",
    "summary": "Arcos elétricos envolvem sua mão, causando 2d8+2 pontos de dano de eletricidade."
  },
  {
    "name": "Tranca Arcana",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 objeto Grande ou menor; Duração: permanente.",
    "summary": "Esta magia tranca uma porta ou outro item que possa ser aberto ou fechado (como um baú, caixa etc.), aumentando a CD de testes de Força ou Ladinagem para abri-lo em +10."
  },
  {
    "name": "Transmutar Objetos",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: matéria-prima, como madeira, rochas, ossos; Duração: cena.",
    "summary": "A magia transforma matéria bruta para moldar um novo objeto."
  },
  {
    "name": "Vitalidade Fantasma",
    "tradition": "Arcana",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: instantânea.",
    "summary": "Você suga energia vital da terra, recebendo 2d10 pontos de vida temporários."
  },
  {
    "name": "Alterar Tamanho",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 objeto; Duração: 1 dia.",
    "summary": "Esta magia aumenta ou diminui o tamanho de um item mundano em até três categorias (um objeto Enorme vira Pequeno, por exemplo)."
  },
  {
    "name": "Amarras Etéreas",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: cena; Resistência: Reflexos anula.",
    "summary": "Três laços de energia surgem e se enroscam no alvo, deixando-o agarrado."
  },
  {
    "name": "Aparência Perfeita",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Esta magia lhe concede um rosto idealizado, porte físico garboso, voz melodiosa e olhar sedutor."
  },
  {
    "name": "Bola de Fogo",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Área: esfera com 6m de raio; Duração: instantânea; Resistência: Reflexos reduz à metade.",
    "summary": "Esta famosa magia de ataque cria uma poderosa explosão, causando 6d6 pontos de dano de fogo em todas as criaturas e objetos livres na área."
  },
  {
    "name": "Campo de Força",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Esta magia cria uma película protetora sobre você."
  },
  {
    "name": "Camuflagem ilusória",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "O alvo fica com sua imagem nublada, como se vista através de um líquido, recebendo os efeitos de camuflagem leve."
  },
  {
    "name": "Crânio Voador de Vladislav",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Esta magia cria um crânio envolto em energia negativa."
  },
  {
    "name": "Desespero Esmagador",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 6m; Duração: instantânea; Resistência: Vontade parcial.",
    "summary": "Humanoides na área são acometidos de grande tristeza, ficando fracos e frustrados até o fim da cena (ou por uma rodada, se passarem no teste de resistência)."
  },
  {
    "name": "Esculpir Sons",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura ou objeto; Duração: cena; Resistência: Vontade anula.",
    "summary": "Esta magia altera os sons emitidos pelo alvo."
  },
  {
    "name": "Flecha Ácida",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura ou objeto; Duração: instantânea; Resistência: Reflexos parcial.",
    "summary": "Você dispara um projétil que causa 4d6 pontos de dano de ácido."
  },
  {
    "name": "Invisibilidade",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Ilusão",
    "exec": "Execução: livre; Alcance: pessoal; Alvo: você; Duração: 1 rodada.",
    "summary": "O alvo fica invisível (incluindo seu equipamento)."
  },
  {
    "name": "LigaçãoTelepática",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 2 criaturas voluntárias; Duração: 1 dia.",
    "summary": "Você cria um elo mental entre duas criaturas com Inteligência –4 ou maior (você pode ser uma delas)."
  },
  {
    "name": "Localização",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: esfera com 90m de raio; Duração: cena.",
    "summary": "Esta magia pode encontrar uma criatura ou objeto a sua escolha."
  },
  {
    "name": "Mapear",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: superfície ou objeto plano, como uma mesa ou papel; Duração: cena.",
    "summary": "Uma fagulha percorre a superfície afetada, queimando-a enquanto esboça um mapa da região onde o conjurador está."
  },
  {
    "name": "Metamorfose",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Você muda sua aparência e forma — incluindo seu equipamento — para qualquer outra criatura, existente ou imaginada."
  },
  {
    "name": "Montaria Arcana",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Efeito: criatura conjurada; Duração: 1 dia.",
    "summary": "Esta magia convoca um parceiro cavalo (ou pônei) de guerra veterano."
  },
  {
    "name": "Refúgio",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Abjuração",
    "exec": "Execução: completa; Alcance: curto; Efeito: domo com 6m de raio; Duração: 1 dia.",
    "summary": "Esta magia cria um domo imóvel e quase opaco por fora, mas transparente pelo lado de dentro."
  },
  {
    "name": "Relâmpago",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: linha de 30m; Duração: instantânea; Resistência: Reflexos reduz à metade.",
    "summary": "Você dispara um poderoso raio que causa 6d6 pontos de dano de eletricidade em todas as criaturas e objetos livres na área."
  },
  {
    "name": "Salto Dimensional",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: você; Duração: instantânea.",
    "summary": "Esta magia transporta você para outro lugar dentro do alcance."
  },
  {
    "name": "Servos Invisíveis",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: longo; Efeito: criaturas conjuradas; Duração: 1 cena.",
    "summary": "Você cria até três servos invisíveis e silenciosos, capazes de realizar tarefas simples como apanhar lenha, colher frutos, varrer o chão ou alimentar um cavalo."
  },
  {
    "name": "Sopro das Uivantes",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 9m; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Você sopra ar gélido que causa 4d6 pontos de dano de frio (Fortitude reduz à metade)."
  },
  {
    "name": "Sussurros Insanos",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 humanoide; Duração: cena; Resistência: Vontade anula.",
    "summary": "Você murmura palavras desconexas que afetam a mente do alvo."
  },
  {
    "name": "Toque Vampírico",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea; Resistência: Fortitude reduz à metade.",
    "summary": "Sua mão brilha com energia sombria, causando 6d6 pontos de dano de trevas."
  },
  {
    "name": "Velocidade",
    "tradition": "Arcana",
    "circle": 2,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: sustentada.",
    "summary": "O alvo pode realizar uma ação padrão ou de movimento adicional por turno."
  },
  {
    "name": "Âncora Dimensional",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura ou objeto; Duração: cena.",
    "summary": "O alvo é envolvido por um campo de força cor de esmeralda que impede qualquer movimento planar."
  },
  {
    "name": "Contato Extraplanar",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Adivinhação",
    "exec": "Execução: completa; Alcance: pessoal; Alvo: você; Duração: 1 dia.",
    "summary": "Sua mente viaja até outro plano de existência, onde entra em contato com seres como gênios e demônios."
  },
  {
    "name": "Convocação Instantânea",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: ilimitado; Alvo: 1 objeto de até 2 espaços; Duração: instantânea.",
    "summary": "Você invoca um objeto de qualquer lugar para sua mão."
  },
  {
    "name": "Dificultar Detecção",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura ou objeto; Duração: 1 dia.",
    "summary": "190 Capítulo Quatro."
  },
  {
    "name": "Enxame Rubro de Ichabod",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: médio; Efeito: 1 enxame Grande (quadrado de 3m); Duração: sustentada; Resistência: Reflexos reduz à metade.",
    "summary": "Você conjura um enxame de pequenas criaturas da Tormenta."
  },
  {
    "name": "Erupção Glacial",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Área: quadrado de 6m de lado; Duração: instantânea; Resistência: Reflexos parcial.",
    "summary": "Estacas de gelo irrompem do chão."
  },
  {
    "name": "Ferver Sangue",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: sustentada; Resistência: Fortitude parcial.",
    "summary": "O sangue do alvo aquece até entrar em ebulição."
  },
  {
    "name": "Globo de Invulnerabilidade",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você é envolto por uma esfera mágica brilhante com 3m de raio, que detém qualquer magia de 2º círculo ou menor."
  },
  {
    "name": "IlusãoLacerante",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: médio; Área: cubo de 9m; Duração: sustentada; Resistência: Vontade anula.",
    "summary": "Você cria uma ilusão de algum perigo mortal."
  },
  {
    "name": "Lança Ígnea de Aleph",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: instantânea; Resistência: Reflexos parcial.",
    "summary": "Esta magia foi desenvolvida pelo mago imortal Aleph Olhos Vermelhos, um entusiasta dos estudos vulcânicos."
  },
  {
    "name": "Miragem",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: longo; Área: cubo de até 90m de lado; Duração: 1 dia; Resistência: Vontade desacredita.",
    "summary": "Você faz um terreno parecer outro, incluindo sons e cheiros."
  },
  {
    "name": "Muralha Elemental",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Efeito: muralha de energia; Duração: cena. Resistência: veja texto.",
    "summary": "Uma muralha de um elemento a sua escolha se eleva da terra."
  },
  {
    "name": "Telecinesia",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: veja texto; Duração: sustentada ou instantânea (veja texto).",
    "summary": "Você move objetos ou criaturas se concentrando."
  },
  {
    "name": "Teletransporte",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: até 5 criaturas voluntárias; Duração: instantânea.",
    "summary": "Esta magia transporta os alvos para um lugar a sua escolha a até 1.000km."
  },
  {
    "name": "Tentáculos de Trevas",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: médio; Área: esfera com 6m de raio; Duração: cena.",
    "summary": "Um círculo de energias sombrias se abre no chão, de onde surgem tentáculos feitos de treva viscosa."
  },
  {
    "name": "Transformação de Guerra",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você se torna uma máquina de combate, ficando mais forte, rápido e resistente."
  },
  {
    "name": "Voo",
    "tradition": "Arcana",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Você recebe deslocamento de voo 12m."
  },
  {
    "name": "Alterar Memória",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea; Resistência: Vontade anula.",
    "summary": "Você invade a mente do alvo e altera ou apaga suas memórias da última hora."
  },
  {
    "name": "Animar Objetos",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: até 8 objetos Minúsculos ou Pequenos, 4 objetos Médios, 2 objetos Grandes ou 1 objeto Enorme; Duração: cena.",
    "summary": "Você concede vida a objetos inanimados."
  },
  {
    "name": "Assassino Fantasmagórico",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: longo; Alvo: 1 criatura; Duração: cena, até ser descarregada; Resistência: Vontade anula, Fortitude parcial.",
    "summary": "Usando os medos subconscientes do alvo, você cria uma imagem daquilo que ele mais teme."
  },
  {
    "name": "Campo Antimagia",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você é cercado por uma barreira invisível com 3m de raio que o acompanha."
  },
  {
    "name": "Conjurar Elemental",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: médio; Efeito: parceiro elemental; Duração: sustentada.",
    "summary": "Esta magia transforma uma porção de um elemento inerte em uma criatura elemental Grande do tipo do elemento alvo."
  },
  {
    "name": "Controlar a Gravidade",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: médio; Área: cubo de 12m de lado; Duração: sustentada.",
    "summary": "Você controla os efeitos da gravidade dentro da área."
  },
  {
    "name": "Desintegrar",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura ou objeto; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Você dispara um raio fino e esverdeado que causa 10d12 pontos de dano de essência."
  },
  {
    "name": "Duplicata Ilusória",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: médio; Efeito: cópia ilusória; Duração: cena.",
    "summary": "Você cria uma cópia ilusória semirreal de."
  },
  {
    "name": "Explosão Caleidoscópica",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: curto; Área: esfera com 6m de raio; Duração: instantânea. Resistência: Fortitude parcial.",
    "summary": "Esta magia cria uma forte explosão de luzes estroboscópicas e sons cacofônicos que desorientam as criaturas atingidas."
  },
  {
    "name": "Forma Etérea",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Transmutação",
    "exec": "Execução: completa; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você e todo o equipamento que está com você são transportados para o plano etéreo, que existe paralelamente ao plano material (o mundo físico)."
  },
  {
    "name": "Mão Poderosa de Talude",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: médio; Efeito: mão gigante de energia; Duração: sustentada.",
    "summary": "Esta magia cria uma mão flutuante Grande que sempre se posiciona entre você e um oponente a sua escolha."
  },
  {
    "name": "Marionete",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: sustentada; Resistência: Fortitude anula.",
    "summary": "Esta magia manipula o sistema nervoso do alvo."
  },
  {
    "name": "Raio Polar",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: instantânea. Resistência: Fortitude parcial.",
    "summary": "Você dispara um raio azul esbranquiçado de gelo e ar congelante."
  },
  {
    "name": "Relâmpago Flamejante de Reynard",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: duas rodadas; Alcance: médio; Efeito: bolas de fogo e relâmpagos; Duração: sustentada; Resistência: Reflexos reduz à metade.",
    "summary": "Esta é uma magia poderosa, desenvolvida pelo metódico e impassível arquimago Reynard."
  },
  {
    "name": "Sonho",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Adivinhação",
    "exec": "Execução: 10 minutos; Alcance: ilimitado; Alvo: 1 criatura viva; Duração: veja texto.",
    "summary": "Você entra nos sonhos de uma criatura."
  },
  {
    "name": "Talho Invisível de Edauros",
    "tradition": "Arcana",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 9m; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Esta magia cruel foi desenvolvida pelo mago de combate Edauros, quando ainda era um bípede."
  },
  {
    "name": "Alterar Destino",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Adivinhação",
    "exec": "Execução: reação; Alcance: pessoal; Alvo: você; Duração: instantânea.",
    "summary": "Sua mente visualiza todas as possibilidades de um evento, permitindo a você escolher o melhor curso de ação."
  },
  {
    "name": "Aprisionamento",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Abjuração",
    "exec": "Execução: completa; Alcance: curto; Alvo: 1 criatura; Duração: permanente; Resistência: Vontade anula.",
    "summary": "Você cria uma prisão mágica para aprisionar uma criatura."
  },
  {
    "name": "Barragem elemental de Vectorius",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: longo; Efeito: 4 esferas elementais; Duração: instantânea; Resistência: Reflexos parcial.",
    "summary": "Criada pelo arquimago Vectorius, esta magia produz quatro esferas, de ácido, eletricidade, fogo e frio, que voam até um ponto a sua escolha."
  },
  {
    "name": "Chuva de Meteoros",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: longo; Área: quadrado com 18m de lado; Duração: instantânea; Resistência: Reflexos parcial.",
    "summary": "Meteoros caem dos céus, devastando a área afetada."
  },
  {
    "name": "Controlar o Tempo",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: veja texto; Duração: veja texto.",
    "summary": "Aquele que controla o tempo controla o mundo."
  },
  {
    "name": "Deflagração de Mana",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Evocação",
    "exec": "Execução: completa; Alcance: pessoal; Área: esfera com 15m de raio; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Após concentrar seu mana, você emana energia, como uma estrela em plena terra."
  },
  {
    "name": "Desejo",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Transmutação",
    "exec": "Execução: completa; Alcance: veja texto; Alvo: veja texto; Duração: veja texto; Resistência: veja texto.",
    "summary": "Esta é a mais poderosa das magias arcanas, permitindo alterar a realidade a seu bel-prazer."
  },
  {
    "name": "Engenho de Mana",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: médio; Efeito: disco de energia com 1,5m de diâmetro; Duração: sustentada.",
    "summary": "Você cria um disco de energia que lembra uma roda de engenho e flutua no ponto em que foi conjurado."
  },
  {
    "name": "Legião",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: médio; Alvo: até 10 criaturas na área; Duração: sustentada. Resistência: Vontade parcial.",
    "summary": "Você domina a mente dos alvos."
  },
  {
    "name": "Mata-Dragão",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Evocação",
    "exec": "Execução: duas rodadas; Alcance: pessoal; Área: cone de 30m; Duração: instantânea; Resistência: Reflexos reduz à metade.",
    "summary": "Esta é uma das mais poderosas magias de destruição existentes."
  },
  {
    "name": "Possessão",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: longo; Alvo: 1 criatura; Duração: 1 dia; Resistência: Vontade anula.",
    "summary": "Você projeta sua consciência no corpo do alvo."
  },
  {
    "name": "Réquiem",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Ilusão",
    "exec": "Execução: completa; Alcance: curto; Alvo: criaturas escolhidas; Duração: sustentada; Resistência: Vontade anula.",
    "summary": "Esta magia cria uma ilusão particular para cada uma das criaturas que atingir."
  },
  {
    "name": "Semiplano",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: curto; Efeito: semiplano com 30m de lado; Duração: 1 dia.",
    "summary": "Você cria uma dimensão particular."
  },
  {
    "name": "Sombra Assassina",
    "tradition": "Arcana",
    "circle": 5,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: cena; Resistência: Vontade parcial.",
    "summary": "Esta magia cria uma duplicata ilusória do alvo na forma de uma silhueta, ligada a ele como se fosse uma manifestação sólida de sua própria sombra."
  },
  {
    "name": "Abençoar Alimentos",
    "tradition": "Divina",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: alimento para 1 criatura; Duração: cena.",
    "summary": "Você purifica e abençoa uma porção de comida ou dose de bebida."
  },
  {
    "name": "Acalmar Animal",
    "tradition": "Divina",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 animal; Duração: cena; Resistência: Vontade anula.",
    "summary": "O animal fica prestativo em relação a você."
  },
  {
    "name": "Arma Espiritual",
    "tradition": "Divina",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Você invoca a arma preferida de sua divindade (caso sua divindade possua uma), que surge flutuando a seu lado."
  },
  {
    "name": "Armamento da Natureza",
    "tradition": "Divina",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 arma (veja texto); Duração: cena.",
    "summary": "Você fortalece uma arma mundana primitiva (sem custo em T$, como bordão, clava, funda ou tacape), uma arma natural ou um ataque desarmado."
  },
  {
    "name": "Bênção",
    "tradition": "Divina",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvos: aliados; Duração: cena.",
    "summary": "Abençoa seus aliados, que recebem +1 em testes de ataque e rolagens de dano."
  },
  {
    "name": "Caminhos da Natureza",
    "tradition": "Divina",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Área: criaturas escolhidas; Duração: 1 dia.",
    "summary": "Você invoca espíritos da natureza, pedindo que eles abram seu caminho."
  },
  {
    "name": "Comando",
    "tradition": "Divina",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 humanoide; Duração: 1 rodada; Resistência: Vontade anula.",
    "summary": "Você dá uma ordem irresistível, que o alvo deve ser capaz de ouvir (mas não."
  },
  {
    "name": "Consagrar",
    "tradition": "Divina",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: longo; Área: esfera com 9m de raio; Duração: 1 dia.",
    "summary": "Você enche a área com energia positiva."
  },
  {
    "name": "Controlar Plantas",
    "tradition": "Divina",
    "circle": 1,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: curto; Área: quadrado com 9m de lado; Duração: cena; Resistência: Reflexos anula.",
    "summary": "Esta magia só pode ser lançada em uma área com vegetação."
  },
  {
    "name": "Criar Elementos",
    "tradition": "Divina",
    "circle": 1,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Efeito: elemento escolhido; Duração: instantânea.",
    "summary": "188 Capítulo Quatro."
  },
  {
    "name": "Curar Ferimentos",
    "tradition": "Divina",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea.",
    "summary": "Você canaliza luz que recupera 2d8+2 pontos de vida na criatura tocada."
  },
  {
    "name": "Despedaçar",
    "tradition": "Divina",
    "circle": 1,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura ou objeto mundano Pequeno; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Esta magia emite um som alto e agudo."
  },
  {
    "name": "Detectar Ameaças",
    "tradition": "Divina",
    "circle": 1,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: esfera com 18m de raio; Duração: cena, até ser descarregada.",
    "summary": "Você recebe uma intuição aguçada sobre perigos ao seu redor."
  },
  {
    "name": "Escudo da Fé",
    "tradition": "Divina",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: reação; Alcance: curto; Alvo: 1 criatura; Duração: 1 turno.",
    "summary": "Um escudo místico se manifesta momentaneamente para bloquear um golpe."
  },
  {
    "name": "Infligir Ferimentos",
    "tradition": "Divina",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea; Resistência: Fortitude reduz à metade.",
    "summary": "Você canaliza energia negativa contra um alvo, causando 2d8+2 pontos de dano de trevas (ou curando 2d8+2 PV, se for um morto-vivo)."
  },
  {
    "name": "Orientação",
    "tradition": "Divina",
    "circle": 1,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: 1 rodada.",
    "summary": "Em seu próximo teste de perícia, o alvo pode rolar dois dados e ficar com o melhor resultado."
  },
  {
    "name": "Perdição",
    "tradition": "Divina",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: curto; Alvos: criaturas escolhidas; Duração: cena; Resistência: nenhuma.",
    "summary": "Amaldiçoa os alvos, que recebem –1 em testes de ataque e rolagens de dano."
  },
  {
    "name": "Profanar",
    "tradition": "Divina",
    "circle": 1,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: longo; Área: esfera com 9m de raio; Duração: 1 dia.",
    "summary": "Você enche a área com energia negativa."
  },
  {
    "name": "Proteção Divina",
    "tradition": "Divina",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Esta magia cria uma barreira mística invisível que fornece ao alvo +2 em testes de resistência."
  },
  {
    "name": "Santuário",
    "tradition": "Divina",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena; Resistência: Vontade anula.",
    "summary": "Qualquer criatura que tente fazer uma ação hostil contra o alvo deve fazer um teste de Vontade."
  },
  {
    "name": "Suporte Ambiental",
    "tradition": "Divina",
    "circle": 1,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: 1 dia.",
    "summary": "Esta magia facilita a sobrevivência em ambientes hostis."
  },
  {
    "name": "Tranquilidade",
    "tradition": "Divina",
    "circle": 1,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 animal ou humanoide; Duração: cena; Resistência: Vontade parcial.",
    "summary": "Você emana ondas de serenidade."
  },
  {
    "name": "Aliado Animal",
    "tradition": "Divina",
    "circle": 2,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 animal prestativo; Duração: 1 dia.",
    "summary": "Você cria um vínculo mental com um animal prestativo em relação a você."
  },
  {
    "name": "Augúrio",
    "tradition": "Divina",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: completa; Alcance: pessoal; Alvo: você; Duração: instantânea.",
    "summary": "Esta magia diz se uma ação que você tomará em breve — no máximo uma hora no futuro — trará resultados bons ou ruins."
  },
  {
    "name": "Círculo da Justiça",
    "tradition": "Divina",
    "circle": 2,
    "school": "Abjuração",
    "exec": "Execução: completa; Alcance: curto; Área: esfera com 9m de raio; Duração: 1 dia; Resistência: Vontade parcial.",
    "summary": "Também conhecida como Lágrimas de Hyninn, esta magia é usada em tribunais e para proteger áreas sensíveis."
  },
  {
    "name": "Condição",
    "tradition": "Divina",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: até 5 criaturas; Duração: cena.",
    "summary": "Pela duração da magia, você sabe a posição e status (PV atuais, se estão com uma condição ou sob efeito de magia...) dos alvos."
  },
  {
    "name": "Controlar Fogo",
    "tradition": "Divina",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: curto; Alvo: veja texto; Duração: cena.",
    "summary": "Você pode criar, moldar, mover ou extinguir chamas e emanações de calor."
  },
  {
    "name": "Controlar Madeira",
    "tradition": "Divina",
    "circle": 2,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 objeto de madeira Grande ou menor; Duração: cena.",
    "summary": "Você molda, retorce, altera ou repele madeira."
  },
  {
    "name": "Enxame de Pestes",
    "tradition": "Divina",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: médio; Efeito: 1 enxame Médio (quadrado de 1,5m); Duração: sustentada. Resistência: Fortitude reduz à metade.",
    "summary": "Você conjura um enxame de criaturas a sua escolha, como besouros, gafanhotos, ratos, morcegos ou serpentes."
  },
  {
    "name": "Físico Divino",
    "tradition": "Divina",
    "circle": 2,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Você fortalece o corpo do alvo."
  },
  {
    "name": "Mente Divina",
    "tradition": "Divina",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Você fortalece a mente do alvo."
  },
  {
    "name": "Miasma Mefítico",
    "tradition": "Divina",
    "circle": 2,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: médio; Área: nuvem com 6m de raio; Duração: instantânea; Resistência: Fortitude (veja texto).",
    "summary": "A área é coberta por emanações letais."
  },
  {
    "name": "Oração",
    "tradition": "Divina",
    "circle": 2,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvos: todas as criaturas (veja texto); Duração: sustentada.",
    "summary": "Você e os seus aliados no alcance recebem +2 em testes de perícia e rolagens de dano, e todos os seus inimigos no alcance sofrem –2 em testes de perícia e rolagens de dano."
  },
  {
    "name": "Purificação",
    "tradition": "Divina",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea.",
    "summary": "Você purifica a criatura tocada, removendo uma condição dela entre abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, "
  },
  {
    "name": "Raio Solar",
    "tradition": "Divina",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: linha de 30m; Duração: instantânea; Resistência: Reflexos (veja texto).",
    "summary": "Você canaliza uma poderosa rajada de energia positiva que ilumina o campo de batalha."
  },
  {
    "name": "Rogar Maldição",
    "tradition": "Divina",
    "circle": 2,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: sustentada; Resistência: Fortitude anula.",
    "summary": "Você entoa cânticos maléficos que amaldiçoam uma vítima, criando efeitos variados."
  },
  {
    "name": "Silêncio",
    "tradition": "Divina",
    "circle": 2,
    "school": "Ilusão",
    "exec": "Execução: padrão; Alcance: médio; Área: esfera com 6m de raio; Duração: sustentada.",
    "summary": "Um silêncio sepulcral recai sobre a área e nenhum som é produzido nela."
  },
  {
    "name": "Soco de Arsenal",
    "tradition": "Divina",
    "circle": 2,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: médio; Alvo: 1 criatura; Duração: instantânea; Resistência: Fortitude parcial.",
    "summary": "Ninguém sabe se Mestre Arsenal foi realmente o criador desta magia — mas ele foi o primeiro a utilizá-la."
  },
  {
    "name": "Tempestade Divina",
    "tradition": "Divina",
    "circle": 2,
    "school": "Evocação",
    "exec": "Execução: completa; Alcance: longo; Área: cilindro com 15m de raio e 15m de altura; Duração: sustentada.",
    "summary": "Esta magia só pode ser usada em ambientes abertos."
  },
  {
    "name": "Vestimenta da Fé",
    "tradition": "Divina",
    "circle": 2,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 armadura, escudo ou vestuário; Duração: 1 dia.",
    "summary": "Você fortalece um item, aumentando o bônus de Defesa de uma armadura ou escudo em +2."
  },
  {
    "name": "Voz Divina",
    "tradition": "Divina",
    "circle": 2,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Você pode conversar com criaturas de qualquer raça e tipo: animal, construto, espírito, humanoide, monstro ou morto-vivo."
  },
  {
    "name": "Anular a Luz",
    "tradition": "Divina",
    "circle": 3,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: pessoal; Área: esfera com 6m de raio; Duração: ver texto.",
    "summary": "Esta magia cria uma onda de escuridão que causa diversos efeitos."
  },
  {
    "name": "Banimento",
    "tradition": "Divina",
    "circle": 3,
    "school": "Abjuração",
    "exec": "Execução: 1d3+1 rodadas; Alcance: curto; Alvo: 1 criatura; Duração: instantânea; Resistência: Vontade parcial.",
    "summary": "Você expulsa uma criatura não nativa de Arton."
  },
  {
    "name": "Coluna de Chamas",
    "tradition": "Divina",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: longo; Área: cilindro com 3m de raio e 30m de altura; Duração: instantânea; Resistência: Reflexos reduz à metade.",
    "summary": "Um pilar de fogo sagrado desce dos céus, causando 6d6 pontos de dano de fogo mais 6d6 pontos de dano de luz nas criaturas e objetos livres na área."
  },
  {
    "name": "Comunhão com a Natureza",
    "tradition": "Divina",
    "circle": 3,
    "school": "Adivinhação",
    "exec": "Execução: completa; Alcance: pessoal; Alvo: você; Duração: 1 dia.",
    "summary": "Após uma breve união com a natureza local, você obtém informações e intuições sobre a região em que está, numa distância equivalente a um dia de viagem."
  },
  {
    "name": "Controlar Água",
    "tradition": "Divina",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: longo; Área: esfera com 30m de raio; Duração: cena; Resistência: veja texto.",
    "summary": "Você controla os movimentos e comportamentos da água."
  },
  {
    "name": "Controlar Terra",
    "tradition": "Divina",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: longo; Área: 9 cubos com 1,5m de lado; Duração: instantânea; Resistência: veja texto.",
    "summary": "Você manipula a densidade e a forma de toda terra, pedra, lama, argila ou areia na área."
  },
  {
    "name": "Despertar Consciência",
    "tradition": "Divina",
    "circle": 3,
    "school": "Encantamento",
    "exec": "Execução: completa; Alcance: toque; Alvo: 1 animal ou planta; Duração: 1 dia.",
    "summary": "Você desperta a consciência de um animal ou planta."
  },
  {
    "name": "Dispersar as Trevas",
    "tradition": "Divina",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: esfera com 6m de raio; Duração: veja texto.",
    "summary": "Esta magia cria um forte brilho (multicolorido ou de uma cor que remeta a sua divindade) que causa diversos efeitos."
  },
  {
    "name": "Heroísmo",
    "tradition": "Divina",
    "circle": 3,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Esta magia imbui uma criatura com coragem e valentia."
  },
  {
    "name": "Missão Divina",
    "tradition": "Divina",
    "circle": 3,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: 1 semana ou até ser descarregada; Resistência: Vontade anula (veja texto)",
    "summary": "Esta magia obriga o alvo a cumprir uma tarefa a sua escolha."
  },
  {
    "name": "Poeira da Podridão",
    "tradition": "Divina",
    "circle": 3,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: médio; Área: nuvem com 6m de raio; Duração: cena; Resistência: Fortitude (veja texto).",
    "summary": "Você manifesta uma nuvem de poeira carregada de energia negativa, que apodrece lentamente as criaturas na área."
  },
  {
    "name": "Potência Divina",
    "tradition": "Divina",
    "circle": 3,
    "school": "Transmutação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você canaliza o poder de sua divindade."
  },
  {
    "name": "Proteção contra Magia",
    "tradition": "Divina",
    "circle": 3,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Você protege o alvo contra efeitos mágicos nocivos."
  },
  {
    "name": "Servo Divino",
    "tradition": "Divina",
    "circle": 3,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Efeito: criatura conjurada; Duração: cena ou até ser descarregada.",
    "summary": "Magia 205."
  },
  {
    "name": "Sopro da Salvação",
    "tradition": "Divina",
    "circle": 3,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Área: cone de 9m; Duração: instantânea.",
    "summary": "Você enche seus pulmões de luz e energia positiva e sopra um cone de poeira reluzente."
  },
  {
    "name": "Viagem Arbórea",
    "tradition": "Divina",
    "circle": 3,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Como parte da execução, você entra em uma árvore adjacente que seja maior do que você."
  },
  {
    "name": "Círculo da Restauração",
    "tradition": "Divina",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: curto; Área: esfera com 3m de raio; Duração: 5 rodadas.",
    "summary": "Você evoca um círculo de luz que emana uma energia poderosa."
  },
  {
    "name": "cólera de azgher",
    "tradition": "Divina",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: médio; Área: esfera com 6m de raio; Duração: instantânea. Resistência: Reflexos parcial.",
    "summary": "Você cria um fulgor dourado e intenso."
  },
  {
    "name": "Conceder Milagre",
    "tradition": "Divina",
    "circle": 4,
    "school": "Encantamento",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: permanente até ser descarregada.",
    "summary": "Você transfere um pouco de seu poder divino a outra criatura."
  },
  {
    "name": "Controlar o Clima",
    "tradition": "Divina",
    "circle": 4,
    "school": "Transmutação",
    "exec": "Execução: completa; Alcance: 2km; Área: esfera com 2km de raio; Duração: 4d12 horas.",
    "summary": "Você muda o clima da área onde se encontra, podendo criar qualquer condição climática: chuva, neve, ventos, névoas."
  },
  {
    "name": "Cúpula de Repulsão",
    "tradition": "Divina",
    "circle": 4,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada; Resistência: Vontade anula.",
    "summary": "Uma cúpula de energia invisível o cerca, impedindo a aproximação de certas criaturas."
  },
  {
    "name": "Guardião Divino",
    "tradition": "Divina",
    "circle": 4,
    "school": "Convocação",
    "exec": "Execução: padrão; Alcance: curto; Efeito: elemental de luz invocado; Duração: cena ou até ser descarregado.",
    "summary": "A magia invoca um elemental Pequeno, com a forma de um orbe feito de luz di-."
  },
  {
    "name": "Ligação Sombria",
    "tradition": "Divina",
    "circle": 4,
    "school": "Necromancia",
    "exec": "Execução: padrão; Alcance: longo; Alvo: 1 criatura; Duração: 1 dia; Resistência: Fortitude anula.",
    "summary": "Cria uma conexão entre seu corpo e o da criatura alvo, deixando uma marca idêntica na pele de ambos."
  },
  {
    "name": "Manto do Cruzado",
    "tradition": "Divina",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: sustentada.",
    "summary": "Você invoca o poder de sua divindade na forma de um manto de energia que reveste seu corpo."
  },
  {
    "name": "Premonição",
    "tradition": "Divina",
    "circle": 4,
    "school": "Adivinhação",
    "exec": "Execução: padrão; Alcance: pessoal; Alvo: você; Duração: cena.",
    "summary": "Vislumbres do futuro permitem que você reavalie suas ações."
  },
  {
    "name": "Terremoto",
    "tradition": "Divina",
    "circle": 4,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: longo; Área: esfera com 30m de raio; Duração: 1 rodada; Resistência: veja texto.",
    "summary": "Esta magia cria um tremor de terra que rasga o solo."
  },
  {
    "name": "Aura Divina",
    "tradition": "Divina",
    "circle": 5,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: pessoal; Área: esfera com 9m de raio; Duração: cena; Resistência: Vontade parcial.",
    "summary": "Você se torna um conduíte da energia de sua divindade, emanando uma aura brilhante."
  },
  {
    "name": "Fúria do Panteão",
    "tradition": "Divina",
    "circle": 5,
    "school": "Evocação",
    "exec": "Execução: completa; Alcance: longo; Área: cubo de 90m; Duração: sustentada; Resistência: veja texto.",
    "summary": "Você cria uma nuvem de tempestade violenta."
  },
  {
    "name": "Intervenção Divina",
    "tradition": "Divina",
    "circle": 5,
    "school": "Convocação",
    "exec": "Execução: completa; Alcance: veja texto; Alvo: veja texto; Duração: veja texto; Resistência: veja texto.",
    "summary": "Você pede a sua divindade para interceder diretamente."
  },
  {
    "name": "Lágrimas de Wynna",
    "tradition": "Divina",
    "circle": 5,
    "school": "Abjuração",
    "exec": "Execução: padrão; Alcance: curto; Alvo: 1 criatura; Duração: instantânea; Resistência: Vontade parcial.",
    "summary": "Se falhar no teste de resistência, o alvo perde a habilidade de lançar magias arcanas até o fim da cena."
  },
  {
    "name": "Reanimação Impura",
    "tradition": "Divina",
    "circle": 5,
    "school": "Necromancia",
    "exec": "Execução: completa; Alcance: toque; Alvo: 1 criatura; Duração: cena.",
    "summary": "Você reanima uma criatura morta recentemente (dentro da mesma cena), trazendo sua alma de volta ao corpo de forma forçada."
  },
  {
    "name": "Segunda Chance",
    "tradition": "Divina",
    "circle": 5,
    "school": "Evocação",
    "exec": "Execução: padrão; Alcance: toque; Alvo: 1 criatura; Duração: instantânea.",
    "summary": "Um brilho de luz, na forma de asas de fênix, emana do alvo."
  }
];
