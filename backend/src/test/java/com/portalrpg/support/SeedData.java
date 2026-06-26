package com.portalrpg.support;

/** Deterministic seed identities (prompt §8). */
public final class SeedData {

    private SeedData() {
    }

    public static final String PASSWORD = "Sup3rSenha!";

    public static final String ADMIN = "admin@test";
    public static final String MESTRE = "mestre@test";
    public static final String PLAYER1 = "player1@test";
    public static final String PLAYER2 = "player2@test"; // PLAYER em A, MASTER em B (F3)
    public static final String INTRUSO = "intruso@test"; // não-membro (casos 403)
}
