package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.FavoriteActor;
import com.movie.gestionfilm.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteActorRepository extends JpaRepository<FavoriteActor, Integer> {
    List<FavoriteActor> findByUtilisateur(Utilisateur utilisateur);
    boolean existsByUtilisateurAndActorId(Utilisateur utilisateur, String actorId);
    Optional<FavoriteActor> findByUtilisateurAndActorId(Utilisateur utilisateur, String actorId);
}