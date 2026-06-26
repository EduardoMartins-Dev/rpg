package com.portalrpg.system;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RpgSystemRepository extends JpaRepository<RpgSystem, UUID> {

    boolean existsBySlug(String slug);

    Optional<RpgSystem> findBySlug(String slug);
}
