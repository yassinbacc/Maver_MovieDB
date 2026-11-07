package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tmdb_movie_actors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovieActor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "movie_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbMovie movie;

    @ManyToOne
    @JoinColumn(name = "actor_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbActor actor;

    @Column(name = "character_name", length = 255)
    private String character;

    @Column(name = "cast_order")
    private Integer castOrder = 0;

    @Column(name = "cast_id")
    private Integer castId;

    @Column(name = "credit_id", length = 100)
    private String creditId;

    @Column(name = "credit_order")
    private Integer order;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}