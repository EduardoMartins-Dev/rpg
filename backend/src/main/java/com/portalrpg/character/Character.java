package com.portalrpg.character;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import com.fasterxml.jackson.databind.JsonNode;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Ficha de personagem. sheet_data é jsonb, conforme o system_sheet_schema do sistema. */
@Entity
@Table(name = "characters")
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "name", nullable = false)
    private String name;

    @Type(JsonType.class)
    @Column(name = "sheet_data", columnDefinition = "jsonb", nullable = false)
    private JsonNode sheetData;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt;

    protected Character() {
    }

    public Character(UUID campaignId, UUID playerId, String name, JsonNode sheetData) {
        this.campaignId = campaignId;
        this.playerId = playerId;
        this.name = name;
        this.sheetData = sheetData;
    }

    public UUID getId() {
        return id;
    }

    public UUID getCampaignId() {
        return campaignId;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public JsonNode getSheetData() {
        return sheetData;
    }

    public void setSheetData(JsonNode sheetData) {
        this.sheetData = sheetData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
