package com.portalrpg.note;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Anotação de campanha pertencente a um jogador (autor). O mestre acessa todas. */
@Entity
@Table(name = "campaign_notes")
public class CampaignNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "title")
    private String title;

    @Column(name = "body", columnDefinition = "text", nullable = false)
    private String body = "";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", insertable = false)
    private Instant updatedAt;

    protected CampaignNote() {
    }

    public CampaignNote(UUID campaignId, UUID authorId, String title, String body) {
        this.campaignId = campaignId;
        this.authorId = authorId;
        this.title = title;
        this.body = body != null ? body : "";
    }

    public UUID getId() {
        return id;
    }

    public UUID getCampaignId() {
        return campaignId;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body != null ? body : "";
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
