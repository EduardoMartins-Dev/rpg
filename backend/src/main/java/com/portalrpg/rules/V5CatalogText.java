package com.portalrpg.rules;

import java.util.stream.Collectors;

import com.portalrpg.rules.V5Catalog.ClanInfo;
import com.portalrpg.rules.V5Catalog.CoterieType;
import com.portalrpg.rules.V5Catalog.DisciplineInfo;

/**
 * Renderiza o catálogo V5 (dados de referência do próprio app) como texto compacto para
 * dar à IA a LISTA CANÔNICA — os 13 clãs, as disciplinas e os tipos de coterie. Isso
 * garante completude em perguntas amplas ("liste todos os clãs") sem depender do
 * retrieval, e separa o que é clã do que é linhagem/coterie. O livro (RAG) detalha cada um.
 */
public final class V5CatalogText {

    private V5CatalogText() {
    }

    /** Bloco de referência para injetar no contexto da IA quando ruleset=v5. */
    public static String referenceBlock() {
        String clans = V5Catalog.clans().stream().map(V5CatalogText::clanLine)
                .collect(Collectors.joining("\n"));
        String disciplines = V5Catalog.disciplines().stream().map(V5CatalogText::disciplineLines)
                .collect(Collectors.joining("\n\n"));
        String coteries = V5Catalog.coterieTypes().stream().map(CoterieType::name)
                .collect(Collectors.joining(", "));

        return """
                REFERÊNCIA OFICIAL DO SISTEMA (Vampiro: A Máscara V5) — lista canônica.
                Use esta lista como verdade para os NOMES e NÍVEIS de clãs, disciplinas e
                poderes; os trechos do livro detalham custo/mecânica de cada um. NÃO invente
                poderes fora desta lista nem custos de experiência.

                Os 13 clãs de V5 são:
                """ + clans
                + "\n\nDisciplinas e seus poderes por nível (nomes canônicos):\n" + disciplines
                + "\n\nTipos de coterie: " + coteries;
    }

    /** Uma disciplina com seus poderes agrupados por nível — dá à IA os nomes e níveis
     *  canônicos (ex.: o que existe em Celeridade nível 1/2/3) sem depender do retrieval. */
    private static String disciplineLines(DisciplineInfo d) {
        String powers = d.powers().stream()
                .sorted((a, b) -> Integer.compare(a.level(), b.level()))
                .map(p -> "N" + p.level() + " " + p.name())
                .collect(Collectors.joining("; "));
        return "- " + d.name() + " — " + d.summary() + " Poderes: " + powers + ".";
    }

    private static String clanLine(ClanInfo c) {
        String disc = String.join(", ", c.disciplines());
        return "- " + c.label() + ": " + c.description()
                + " Disciplinas de clã: " + (disc.isBlank() ? "(especiais)" : disc) + ".";
    }
}
