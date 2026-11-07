package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbMovieCrew;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TmdbMovieCrewRepository extends JpaRepository<TmdbMovieCrew, Integer> {
}