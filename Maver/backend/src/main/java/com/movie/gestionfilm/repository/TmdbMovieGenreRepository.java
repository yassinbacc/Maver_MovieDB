package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbMovieGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TmdbMovieGenreRepository extends JpaRepository<TmdbMovieGenre, Integer> {
}