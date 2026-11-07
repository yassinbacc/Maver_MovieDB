package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbMovie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TmdbMovieRepository extends JpaRepository<TmdbMovie, Integer> {
    Optional<TmdbMovie> findByTmdbId(Integer tmdbId);
    boolean existsByTmdbId(Integer tmdbId);
}