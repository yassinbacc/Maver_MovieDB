package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.FilmActeur;
import com.movie.gestionfilm.model.FilmActeurId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilmActeurRepository extends JpaRepository<FilmActeur, FilmActeurId> {
    @Query("SELECT fa FROM FilmActeur fa WHERE fa.film.id = :filmId")
    List<FilmActeur> findByFilmId(@Param("filmId") Integer filmId);

    @Query("SELECT fa FROM FilmActeur fa WHERE fa.acteur.id = :acteurId")
    List<FilmActeur> findByActeurId(@Param("acteurId") Integer acteurId);

    @Modifying
    @Query("DELETE FROM FilmActeur fa WHERE fa.film.id = :filmId AND fa.acteur.id = :acteurId")
    void deleteByFilmIdAndActeurId(@Param("filmId") Integer filmId, @Param("acteurId") Integer acteurId);
}