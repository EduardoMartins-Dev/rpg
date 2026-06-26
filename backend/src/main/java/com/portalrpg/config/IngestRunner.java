package com.portalrpg.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.portalrpg.rag.DocumentChunkStore;
import com.portalrpg.system.RpgSystem;
import com.portalrpg.system.RpgSystemRepository;
import com.portalrpg.system.SystemDocument;
import com.portalrpg.system.SystemDocumentRepository;
import com.portalrpg.system.SystemService;

/**
 * Ingestão offline do RAG via linha de comando — alimenta um sistema SEM subir o
 * livro pela API do Render. Aponte o app pro MESMO banco (Supabase) e rode:
 *
 *   java -jar app.jar --ingest --system=<slug|uuid> --file=livro.pdf [--file=outro.txt] [--title="Manual"] [--clear]
 *
 * O embedding é local/determinístico, então os vetores ficam idênticos aos de prod.
 * Sai do processo ao terminar (0 = ok, 1 = erro). Em boot normal (sem --ingest) é no-op.
 */
@Component
@Order(100)
public class IngestRunner implements CommandLineRunner {

    private final RpgSystemRepository systems;
    private final SystemDocumentRepository documents;
    private final SystemService systemService;
    private final com.portalrpg.rag.RagIndexingService indexing;
    private final DocumentChunkStore chunks;

    public IngestRunner(RpgSystemRepository systems, SystemDocumentRepository documents,
            SystemService systemService, com.portalrpg.rag.RagIndexingService indexing,
            DocumentChunkStore chunks) {
        this.systems = systems;
        this.documents = documents;
        this.systemService = systemService;
        this.indexing = indexing;
        this.chunks = chunks;
    }

    @Override
    public void run(String... args) {
        if (!hasFlag(args, "ingest")) {
            return; // boot normal
        }
        try {
            ingest(args);
            System.out.println("[ingest] concluído.");
            System.exit(0);
        } catch (Exception e) {
            System.err.println("[ingest] ERRO: " + e.getMessage());
            System.exit(1);
        }
    }

    private void ingest(String[] args) {
        String systemRef = opt(args, "system");
        List<String> files = opts(args, "file");
        String title = opt(args, "title");
        boolean clear = hasFlag(args, "clear");

        if (systemRef == null || files.isEmpty()) {
            throw new IllegalArgumentException(
                    "uso: --ingest --system=<slug|uuid> --file=<caminho> [--file=...] [--title=..] [--clear]");
        }

        RpgSystem system = resolveSystem(systemRef);
        System.out.printf("[ingest] sistema: %s (%s) · %d arquivo(s)%n",
                system.getName(), system.getSlug(), files.size());

        if (clear) {
            int removed = systemService.clearIndex(system.getId());
            System.out.printf("[ingest] índice limpo: %d chunk(s) removidos%n", removed);
        }

        for (String f : files) {
            Path p = Path.of(f);
            if (!Files.isRegularFile(p)) {
                throw new IllegalArgumentException("arquivo não encontrado: " + f);
            }
            SystemDocument doc = new SystemDocument(system.getId(), p.toUri().toString());
            documents.saveAndFlush(doc);
            long before = chunks.countBySystem(system.getId());
            indexing.index(doc);
            long after = chunks.countBySystem(system.getId());
            System.out.printf("[ingest]   %s → %d chunk(s) (%s)%n",
                    p.getFileName(), after - before, doc.getStatus());
        }
        System.out.printf("[ingest] total no sistema: %d chunk(s)%n", chunks.countBySystem(system.getId()));
    }

    private RpgSystem resolveSystem(String ref) {
        return systems.findBySlug(ref).or(() -> tryUuid(ref))
                .orElseThrow(() -> new IllegalArgumentException("sistema não encontrado: " + ref));
    }

    private java.util.Optional<RpgSystem> tryUuid(String ref) {
        try {
            return systems.findById(UUID.fromString(ref));
        } catch (IllegalArgumentException e) {
            return java.util.Optional.empty();
        }
    }

    // --- parsing de --chave=valor / --flag ---------------------------------

    private static boolean hasFlag(String[] args, String name) {
        String pfx = "--" + name;
        for (String a : args) {
            if (a.equals(pfx) || a.startsWith(pfx + "=")) {
                return true;
            }
        }
        return false;
    }

    private static String opt(String[] args, String name) {
        List<String> all = opts(args, name);
        return all.isEmpty() ? null : all.get(0);
    }

    private static List<String> opts(String[] args, String name) {
        String pfx = "--" + name + "=";
        List<String> out = new ArrayList<>();
        for (String a : args) {
            if (a.startsWith(pfx)) {
                out.add(a.substring(pfx.length()));
            }
        }
        return out;
    }
}
