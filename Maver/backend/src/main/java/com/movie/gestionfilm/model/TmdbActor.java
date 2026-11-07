package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "tmdb_actors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbActor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tmdb_id", unique = true, nullable = false)
    private Integer tmdbId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "profile_path", length = 500)
    private String profilePath;

    @Column(columnDefinition = "TEXT")
    private String biography;

    private LocalDate birthday;

    private LocalDate deathday;

    @Column(name = "place_of_birth", length = 255)
    private String placeOfBirth;

    @Column(name = "known_for_department", length = 100)
    private String knownForDepartment;

    @Column(precision = 10, scale = 2)
    private BigDecimal popularity;

    private Integer gender; 

    @Column(name = "also_known_as", columnDefinition = "JSON")
    private String alsoKnownAs;

    @Column(name = "imdb_id", length = 20)
    private String imdbId;

    @Column(length = 500)
    private String homepage;

    @Column(name = "tmdb_data", columnDefinition = "JSON")
    private String tmdbData;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @OneToMany(mappedBy = "actor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TmdbMovieActor> movies;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}