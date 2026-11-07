package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.model.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Integer> {
    List<Watchlist> findByUtilisateur(Utilisateur utilisateur);
    Optional<Watchlist> findByIdAndUtilisateur(Integer id, Utilisateur utilisateur);
    boolean existsByUtilisateurAndName(Utilisateur utilisateur, String name);
}