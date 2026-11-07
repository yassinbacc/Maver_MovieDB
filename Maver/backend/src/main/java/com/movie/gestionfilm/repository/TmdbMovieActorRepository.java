package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.TmdbMovieActor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TmdbMovieActorRepository extends JpaRepository<TmdbMovieActor, Integer> {
    @Query("SELECT ma FROM TmdbMovieActor ma JOIN FETCH ma.movie JOIN FETCH ma.actor WHERE ma.actor.tmdbId = :actorTmdbId")
    List<TmdbMovieActor> findByActorTmdbId(@Param("actorTmdbId") Integer actorTmdbId);
}