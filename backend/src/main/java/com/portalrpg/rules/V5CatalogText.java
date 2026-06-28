package com.portalrpg.rules;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.portalrpg.rules.V5Catalog.ClanInfo;
import com.portalrpg.rules.V5Catalog.CoterieType;
import com.portalrpg.rules.V5Catalog.DisciplineInfo;

/**
 * Renderiza o catálogo V5 (dados de referência do próprio app) como texto compacto para
 * dar à IA a LISTA CANÔNICA — os 13 clãs, as disciplinas e os tipos de coterie. Isso
 * garante completude em perguntas amplas ("liste todos os clãs") sem depender do
 * retrieval, e separa o que é clã do que é linhagem/coterie. O livro (RAG) detalha cada um.
 *
 * <p>Para economizar tokens (limite diário do provedor de IA), o bloco é CONTEXTUAL: sempre
 * inclui a lista de NOMES (clãs/disciplinas/coteries, barato), e só expande o detalhe
 * (poderes por nível de uma disciplina, descrição de um clã) quando o assunto aparece na
 * pergunta. Perguntas amplas ainda recebem os nomes completos; perguntas específicas
 * recebem o detalhe só do que importa, em vez dos 11 blocos inteiros.
 */
public final class V5CatalogText {

    private V5CatalogText() {
    }

    /** Bloco completo (todos os detalhes). Mantido para usos sem contexto/testes. */
    public static String referenceBlock() {
        return referenceBlock(null);
    }

    /** Bloco de referência contextual: nomes sempre; detalhe só do que a pergunta cita. */
    public static String referenceBlock(String question) {
        String qn = normalize(question == null ? "" : question);

        String clanNames = V5Catalog.clans().stream().map(ClanInfo::label)
                .collect(Collectors.joining(", "));
        String discNames = V5Catalog.disciplines().stream().map(DisciplineInfo::name)
                .collect(Collectors.joining(", "));
        String coteries = V5Catalog.coterieTypes().stream().map(CoterieType::name)
                .collect(Collectors.joining(", "));

        // Detalhe só do que foi citado na pergunta (ou tudo, se a pergunta for ampla).
        boolean broadClans = qn.matches(".*\\bcla[sn]?\\b.*"); // "clã/clãs/clan/clans" (palavra)
        List<ClanInfo> clansDetail = V5Catalog.clans().stream()
                .filter(c -> broadClans || mentions(qn, c.label()))
                .toList();
        List<DisciplineInfo> discDetail = V5Catalog.disciplines().stream()
                .filter(d -> disciplineRelevant(qn, d))
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("""
                REFERÊNCIA OFICIAL DO SISTEMA (Vampiro: A Máscara V5) — lista canônica.
                Use esta lista como verdade para os NOMES e NÍVEIS de clãs, disciplinas e
                poderes; os trechos do livro detalham custo/mecânica de cada um. NÃO invente
                poderes fora desta lista nem custos de experiência.
                """);
        sb.append("\nOs 13 clãs: ").append(clanNames);
        sb.append("\nDisciplinas: ").append(discNames);
        sb.append("\nTipos de coterie: ").append(coteries);

        if (!clansDetail.isEmpty()) {
            sb.append("\n\nDetalhe de clã:\n").append(clansDetail.stream()
                    .map(V5CatalogText::clanLine).collect(Collectors.joining("\n")));
        }
        if (!discDetail.isEmpty()) {
            sb.append("\n\nPoderes por nível (nomes canônicos):\n").append(discDetail.stream()
                    .map(V5CatalogText::disciplineLines).collect(Collectors.joining("\n\n")));
        }
        return sb.toString();
    }

    /** Termos para EXPANDIR a query de retrieval: nomes (PT + inglês) dos poderes das
     *  disciplinas citadas na pergunta. Sem isso, o trecho de um poder cujo texto não cita a
     *  disciplina (ex.: "cat's grace ... trapeze artists") fica longe da busca por "Celeridade"
     *  e não é recuperado. Devolve "" se nenhuma disciplina for citada. */
    public static String retrievalExpansion(String question) {
        String qn = normalize(question == null ? "" : question);
        return V5Catalog.disciplines().stream()
                .filter(d -> disciplineRelevant(qn, d))
                .flatMap(d -> d.powers().stream())
                .flatMap(p -> java.util.stream.Stream.of(p.name(), p.en()))
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }

    /** Uma query de busca POR PODER (nome PT + inglês) para as disciplinas citadas. Permite
     *  retrieval direcionado: buscar o trecho de cada poder individualmente, em vez de uma
     *  query única que compete com o ruído do índice. Vazio se nenhuma disciplina for citada. */
    public static List<String> powerQueries(String question) {
        String qn = normalize(question == null ? "" : question);
        return V5Catalog.disciplines().stream()
                .filter(d -> disciplineRelevant(qn, d))
                .flatMap(d -> d.powers().stream())
                .map(p -> p.en() == null ? p.name() : p.name() + " " + p.en())
                .toList();
    }

    /** Disciplina é relevante se a pergunta cita seu nome ou o nome de algum de seus poderes
     *  (PT ou inglês). Nomes muito curtos não contam, para evitar falso positivo. */
    private static boolean disciplineRelevant(String qn, DisciplineInfo d) {
        if (mentions(qn, d.name())) {
            return true;
        }
        return d.powers().stream()
                .anyMatch(p -> mentions(qn, p.name()) || mentions(qn, p.en()));
    }

    /** true se a pergunta (normalizada) contém o termo (normalizado), com guarda de tamanho. */
    private static boolean mentions(String qn, String term) {
        if (term == null) {
            return false;
        }
        String t = normalize(term);
        return t.length() >= 4 && qn.contains(t);
    }

    /** Uma disciplina com seus poderes agrupados por nível — dá à IA os nomes e níveis
     *  canônicos (ex.: o que existe em Celeridade nível 1/2/3) sem depender do retrieval. */
    private static String disciplineLines(DisciplineInfo d) {
        String powers = d.powers().stream()
                .sorted((a, b) -> Integer.compare(a.level(), b.level()))
                .map(p -> "N" + p.level() + " " + p.name()
                        + (p.en() == null ? "" : " [" + p.en() + "]"))
                .collect(Collectors.joining("; "));
        return "- " + d.name() + " — " + d.summary() + " Poderes: " + powers + ".";
    }

    private static String clanLine(ClanInfo c) {
        String disc = String.join(", ", c.disciplines());
        return "- " + c.label() + ": " + c.description()
                + " Disciplinas de clã: " + (disc.isBlank() ? "(especiais)" : disc) + ".";
    }

    private static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
    }
}
