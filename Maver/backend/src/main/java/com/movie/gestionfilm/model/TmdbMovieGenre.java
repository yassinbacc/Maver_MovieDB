package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tmdb_movie_genres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovieGenre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "movie_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbMovie movie;

    @ManyToOne
    @JoinColumn(name = "genre_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbGenre genre;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}