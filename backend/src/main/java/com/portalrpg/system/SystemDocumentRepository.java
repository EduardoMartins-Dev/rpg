package com.portalrpg.system;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemDocumentRepository extends JpaRepository<SystemDocument, UUID> {

    List<SystemDocument> findBySystemIdOrderByCreatedAtAsc(UUID systemId);

    long deleteBySystemId(UUID systemId);
}
