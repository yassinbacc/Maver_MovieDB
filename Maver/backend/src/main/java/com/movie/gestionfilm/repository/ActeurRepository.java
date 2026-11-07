package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Acteur;
import com.movie.gestionfilm.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActeurRepository extends JpaRepository<Acteur, Integer> {
    Optional<Acteur> findByUtilisateurId(Integer utilisateurId);
    Optional<Acteur> findByUtilisateur(Utilisateur utilisateur);
    Optional<Acteur> findByTmdbId(Integer tmdbId);
}