package com.portalrpg.character;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.portalrpg.common.ApiException;
import com.portalrpg.rules.V5Catalog;
import com.portalrpg.rules.V5Catalog.CharacterType;
import com.portalrpg.rules.V5Catalog.ClanInfo;
import com.portalrpg.rules.V5Engine;

/**
 * Interpreta a ficha (jsonb dinâmico) aplicando o motor V5. A ESTRUTURA dos campos vem
 * do sheet-schema (atributos/perícias declarados), as REGRAS numéricas vêm do {@link V5Engine}.
 * Campos servidor-computados (derived/clanDisciplines/bane/compulsion) são sobrescritos aqui,
 * nunca confiados na entrada do cliente.
 */
@Component
public class V5SheetProcessor {

    private final ObjectMapper mapper;

    public V5SheetProcessor(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /** Valida contra o schema, aplica regras V5 e devolve a ficha enriquecida (cópia). */
    public JsonNode process(JsonNode sheetData, JsonNode schema) {
        if (sheetData == null || !sheetData.isObject()) {
            throw ApiException.badRequest("sheetData must be a JSON object");
        }
        ObjectNode sheet = sheetData.deepCopy();

        CharacterType type = parseType(sheet);
        validateTraits(sheet, schema);
        applyTypeRules(sheet, type);
        recomputeDerived(sheet);
        return sheet;
    }

    private CharacterType parseType(ObjectNode sheet) {
        String raw = sheet.path("type").asText("VAMPIRO");
        try {
            CharacterType t = CharacterType.valueOf(raw.trim().toUpperCase());
            sheet.put("type", t.name());
            return t;
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("unknown character type: " + raw);
        }
    }

    /** Atributos/perícias: pertencem ao schema (se declarado) e ficam na faixa 1–5; Fome 0–5. */
    private void validateTraits(ObjectNode sheet, JsonNode schema) {
        validateGroup(sheet, schema, "attributes");
        validateGroup(sheet, schema, "skills");
        if (sheet.hasNonNull("hunger")) {
            try {
                V5Engine.requireHungerRange(sheet.get("hunger").asInt());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest(e.getMessage());
            }
        }
    }

    private void validateGroup(ObjectNode sheet, JsonNode schema, String group) {
        JsonNode node = sheet.get(group);
        if (node == null || node.isNull()) {
            return;
        }
        if (!node.isObject()) {
            throw ApiException.badRequest(group + " must be a JSON object of name→value");
        }
        Set<String> declared = declaredNames(schema, group);
        for (Iterator<Map.Entry<String, JsonNode>> it = node.fields(); it.hasNext();) {
            Map.Entry<String, JsonNode> e = it.next();
            if (!declared.isEmpty() && !declared.contains(e.getKey())) {
                throw ApiException.badRequest("unknown " + group + " field: " + e.getKey());
            }
            if (!e.getValue().isInt() && !e.getValue().canConvertToInt()) {
                throw ApiException.badRequest(group + "." + e.getKey() + " must be an integer");
            }
            try {
                V5Engine.requireTraitRange(e.getValue().asInt());
            } catch (IllegalArgumentException ex) {
                throw ApiException.badRequest(group + "." + e.getKey() + ": " + ex.getMessage());
            }
        }
    }

    private Set<String> declaredNames(JsonNode schema, String group) {
        Set<String> names = new HashSet<>();
        if (schema != null && schema.get(group) != null && schema.get(group).isArray()) {
            schema.get(group).forEach(n -> names.add(n.asText()));
        }
        return names;
    }

    /** §13.5: Mortal não tem clã/disciplinas/tipo de predador. Carniçal/Vampiro têm clã. */
    private void applyTypeRules(ObjectNode sheet, CharacterType type) {
        if (type == CharacterType.MORTAL) {
            if (sheet.hasNonNull("clan") || sheet.hasNonNull("predatorType")) {
                throw ApiException.badRequest("mortal has no clan or predator type");
            }
            sheet.remove("clanDisciplines");
            sheet.remove("bane");
            sheet.remove("compulsion");
            return;
        }
        autoPopulateClan(sheet);
    }

    /** §9.6/§13.2: selecionar clã auto-popula disciplinas + maldição + compulsão. */
    private void autoPopulateClan(ObjectNode sheet) {
        if (!sheet.hasNonNull("clan")) {
            return;
        }
        ClanInfo info;
        try {
            info = V5Catalog.clan(V5Catalog.clanOf(sheet.get("clan").asText()));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest(e.getMessage());
        }
        sheet.put("clan", info.clan().name());
        ArrayNode disc = mapper.createArrayNode();
        info.disciplines().forEach(disc::add);
        sheet.set("clanDisciplines", disc);
        sheet.put("bane", info.bane());
        sheet.put("compulsion", info.compulsion());
    }

    /** §9.1: Vitalidade = Vigor+3; FdV = Autocontrole+Determinação. Recalcula sempre. */
    private void recomputeDerived(ObjectNode sheet) {
        JsonNode attrs = sheet.get("attributes");
        if (attrs == null || !attrs.isObject()) {
            return;
        }
        ObjectNode derived = mapper.createObjectNode();
        if (attrs.hasNonNull("vigor")) {
            derived.put("vitality", V5Engine.vitality(attrs.get("vigor").asInt()));
        }
        if (attrs.hasNonNull("autocontrole") && attrs.hasNonNull("determinacao")) {
            derived.put("willpower",
                    V5Engine.willpower(attrs.get("autocontrole").asInt(), attrs.get("determinacao").asInt()));
        }
        sheet.set("derived", derived);
    }
}
