package com.portalrpg.rules;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.rules.V5Catalog.Ability;
import com.portalrpg.rules.V5Catalog.AbilityCategory;
import com.portalrpg.rules.V5Catalog.ClanInfo;

/**
 * Reference data dos sistemas para enriquecer a ficha no front (seletor de clã com
 * descrição/buffs, perícias por categoria, etc). Apenas FIXTURES factuais do catálogo —
 * o texto integral de poderes/lore continua vindo do PDF indexado (RAG), nunca daqui.
 * Read-only; qualquer usuário autenticado pode ler.
 */
@RestController
@RequestMapping("/api/rules")
public class RulesController {

    public record ClanView(String id, String label, String description,
            List<String> disciplines, String bane, String compulsion) {
    }

    public record AbilityGroup(String category, List<String> abilities) {
    }

    public record V5CatalogView(
            List<String> types,
            List<ClanView> clans,
            List<AbilityGroup> abilities) {
    }

    @GetMapping("/v5/catalog")
    public V5CatalogView v5Catalog() {
        List<ClanView> clans = V5Catalog.clans().stream()
                .map(this::toClanView)
                .toList();

        Map<AbilityCategory, List<Ability>> byCat = V5Catalog.abilities().stream()
                .collect(Collectors.groupingBy(Ability::category));
        List<AbilityGroup> abilities = List.of(
                group(byCat, AbilityCategory.FISICAS),
                group(byCat, AbilityCategory.SOCIAIS),
                group(byCat, AbilityCategory.MENTAIS));

        List<String> types = List.of(
                V5Catalog.CharacterType.VAMPIRO.name(),
                V5Catalog.CharacterType.MORTAL.name(),
                V5Catalog.CharacterType.CARNICAL.name());

        return new V5CatalogView(types, clans, abilities);
    }

    private ClanView toClanView(ClanInfo c) {
        return new ClanView(c.clan().name(), c.label(), c.description(),
                c.disciplines(), c.bane(), c.compulsion());
    }

    private AbilityGroup group(Map<AbilityCategory, List<Ability>> byCat, AbilityCategory cat) {
        List<String> names = byCat.getOrDefault(cat, List.of()).stream()
                .map(Ability::name)
                .toList();
        return new AbilityGroup(cat.name(), names);
    }
}
