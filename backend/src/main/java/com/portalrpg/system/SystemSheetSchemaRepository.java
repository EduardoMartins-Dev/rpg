package com.portalrpg.system;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSheetSchemaRepository extends JpaRepository<SystemSheetSchema, UUID> {

    Optional<SystemSheetSchema> findBySystemId(UUID systemId);
}
