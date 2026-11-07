package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TmdbGenreRepository extends JpaRepository<TmdbGenre, Integer> {
    Optional<TmdbGenre> findByTmdbId(Integer tmdbId);
    boolean existsByTmdbId(Integer tmdbId);
}