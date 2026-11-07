package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbMovieVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TmdbMovieVideoRepository extends JpaRepository<TmdbMovieVideo, Integer> {
}