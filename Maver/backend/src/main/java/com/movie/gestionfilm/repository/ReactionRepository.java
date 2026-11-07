package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Post;
import com.movie.gestionfilm.model.Reaction;
import com.movie.gestionfilm.model.Reaction.ReactionType;
import com.movie.gestionfilm.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Integer> {
    Optional<Reaction> findByPostAndUser(Post post, Utilisateur user);

    @Query("SELECT COUNT(r) FROM Reaction r WHERE r.post.id = :postId AND r.reactionType = :reactionType")
    Long countByPostIdAndReactionType(@Param("postId") Integer postId, @Param("reactionType") ReactionType reactionType);

    @Query("SELECT r FROM Reaction r WHERE r.post.id = :postId")
    List<Reaction> findByPostId(@Param("postId") Integer postId);
}