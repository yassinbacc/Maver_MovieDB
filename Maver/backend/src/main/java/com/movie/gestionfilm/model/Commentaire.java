package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "commentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "film_id")
    private Film film;

    @Column(name = "tmdb_film_id")
    private Integer tmdbFilmId;

    @ManyToOne
    @JoinColumn(name = "acteur_id")
    private Acteur acteur;

    @Column(name = "tmdb_acteur_id")
    private Integer tmdbActeurId;

    @ManyToOne
    @JoinColumn(name = "fan_id", nullable = false)
    private Utilisateur fan;

    @Column(nullable = false)
    private Integer note;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_commentaire", nullable = false, updatable = false)
    private LocalDateTime dateCommentaire;

    @PrePersist
    protected void onCreate() {
        dateCommentaire = LocalDateTime.now();
    }
}