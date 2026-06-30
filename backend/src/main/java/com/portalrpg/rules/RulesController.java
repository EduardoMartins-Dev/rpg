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

    public record BloodPotencyView(int potency, int bloodSurge, int rouseReroll,
            int disciplineBonus, int baneSeverity, int mendingRouse) {
    }

    public record PowerView(int level, String name, String en) {
    }

    public record DisciplineView(String name, String summary, List<PowerView> powers) {
    }

    public record PredatorView(String name, String summary, List<String> disciplines) {
    }

    public record ResonanceView(String name, String emotion, List<String> disciplines) {
    }

    public record CoterieView(String name, String summary) {
    }

    public record V5CatalogView(
            List<String> types,
            List<ClanView> clans,
            List<AbilityGroup> abilities,
            List<BloodPotencyView> bloodPotency,
            List<DisciplineView> disciplines,
            List<PredatorView> predatorTypes,
            List<String> advantages,
            List<String> flaws,
            List<ResonanceView> resonances,
            List<CoterieView> coterieTypes) {
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

        List<BloodPotencyView> bloodPotency = java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(V5Catalog::bloodPotency)
                .map(t -> new BloodPotencyView(t.potency(), t.bloodSurge(), t.rouseReroll(),
                        t.disciplineBonus(), t.baneSeverity(), t.mendingRouse()))
                .toList();

        List<DisciplineView> disciplines = V5Catalog.disciplines().stream()
                .map(d -> new DisciplineView(d.name(), d.summary(),
                        d.powers().stream().map(p -> new PowerView(p.level(), p.name(), p.en())).toList()))
                .toList();

        List<PredatorView> predators = V5Catalog.predatorTypes().stream()
                .map(pt -> new PredatorView(pt.name(), pt.summary(), pt.disciplines()))
                .toList();

        List<ResonanceView> resonances = V5Catalog.resonances().stream()
                .map(r -> new ResonanceView(r.name(), r.emotion(), r.disciplines()))
                .toList();
        List<CoterieView> coteries = V5Catalog.coterieTypes().stream()
                .map(c -> new CoterieView(c.name(), c.summary()))
                .toList();

        return new V5CatalogView(types, clans, abilities, bloodPotency, disciplines, predators,
                V5Catalog.advantages(), V5Catalog.flaws(), resonances, coteries);
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
