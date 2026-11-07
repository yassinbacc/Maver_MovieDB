package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.WatchlistItem;
import com.movie.gestionfilm.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Integer> {
    List<WatchlistItem> findByUtilisateur(Utilisateur utilisateur);
    boolean existsByUtilisateurAndFilmId(Utilisateur utilisateur, String filmId);
    Optional<WatchlistItem> findByUtilisateurAndFilmId(Utilisateur utilisateur, String filmId);
}