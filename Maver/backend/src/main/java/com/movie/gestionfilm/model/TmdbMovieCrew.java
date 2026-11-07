package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tmdb_movie_crew")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovieCrew {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "movie_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbMovie movie;

    @Column(name = "person_tmdb_id", nullable = false)
    private Integer personTmdbId;

    @Column(nullable = false, length = 100)
    private String job;

    @Column(length = 100)
    private String department;

    @Column(name = "credit_id", length = 100)
    private String creditId;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}