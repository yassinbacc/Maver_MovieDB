package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Integer> {
    List<Commentaire> findByFilmId(Integer filmId);
    List<Commentaire> findByTmdbFilmId(Integer tmdbFilmId);
    List<Commentaire> findByActeurId(Integer acteurId);
    List<Commentaire> findByTmdbActeurId(Integer tmdbActeurId);
    List<Commentaire> findByFanId(Integer fanId);
}