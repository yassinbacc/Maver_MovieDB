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
@Table(name = "tmdb_movies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tmdb_id", unique = true, nullable = false)
    private Integer tmdbId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "original_title", length = 255)
    private String originalTitle;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    private Integer runtime;

    @Column(name = "vote_average", precision = 3, scale = 1)
    private BigDecimal voteAverage;

    @Column(name = "vote_count")
    private Integer voteCount = 0;

    @Column(precision = 10, scale = 2)
    private BigDecimal popularity;

    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(name = "backdrop_path", length = 500)
    private String backdropPath;

    @Column(name = "trailer_key", length = 100)
    private String trailerKey;

    @Column(length = 255)
    private String director;

    @Column(length = 255)
    private String writer;

    private Long budget;

    private Long revenue;

    @Column(length = 50)
    private String status;

    @Column(length = 500)
    private String tagline;

    @Column(name = "imdb_id", length = 20)
    private String imdbId;

    @Column(length = 500)
    private String homepage;

    @Column(name = "original_language", length = 10)
    private String originalLanguage;

    @Column(name = "production_companies", columnDefinition = "JSON")
    private String productionCompanies;

    @Column(name = "production_countries", columnDefinition = "JSON")
    private String productionCountries;

    @Column(name = "spoken_languages", columnDefinition = "JSON")
    private String spokenLanguages;

    @Column(name = "tmdb_data", columnDefinition = "JSON")
    private String tmdbData;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TmdbMovieGenre> genres;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TmdbMovieActor> actors;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TmdbMovieCrew> crew;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TmdbMovieVideo> videos;

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