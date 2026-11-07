package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Film;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FilmRepository extends JpaRepository<Film, Integer> {
    List<Film> findByTitreContainingIgnoreCase(String titre);
    List<Film> findByGenre(Film.Genre genre);
    List<Film> findByAnneeSortie(Integer anneeSortie);
    List<Film> findByRealisateurId(Integer realisateurId);
    Optional<Film> findByTitre(String titre);
}