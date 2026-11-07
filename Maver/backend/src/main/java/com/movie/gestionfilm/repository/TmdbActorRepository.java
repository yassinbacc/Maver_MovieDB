package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbActor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TmdbActorRepository extends JpaRepository<TmdbActor, Integer> {
    Optional<TmdbActor> findByTmdbId(Integer tmdbId);
    boolean existsByTmdbId(Integer tmdbId);
    Optional<TmdbActor> findByNameIgnoreCase(String name);
    List<TmdbActor> findByNameContainingIgnoreCase(String name);
}