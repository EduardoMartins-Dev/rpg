package com.portalrpg.system;

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

/** Template (jsonb) da ficha por sistema. 1:1 com rpg_systems. */
@Entity
@Table(name = "system_sheet_schema")
public class SystemSheetSchema {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "system_id", nullable = false, unique = true)
    private UUID systemId;

    @Type(JsonType.class)
    @Column(name = "schema", columnDefinition = "jsonb", nullable = false)
    private JsonNode schema;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt;

    protected SystemSheetSchema() {
    }

    public SystemSheetSchema(UUID systemId, JsonNode schema) {
        this.systemId = systemId;
        this.schema = schema;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSystemId() {
        return systemId;
    }

    public JsonNode getSchema() {
        return schema;
    }

    public void setSchema(JsonNode schema) {
        this.schema = schema;
    }
}
