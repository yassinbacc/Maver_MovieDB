package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tmdb_movie_videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovieVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "movie_tmdb_id", referencedColumnName = "tmdb_id", nullable = false)
    private TmdbMovie movie;

    @Column(name = "video_id", nullable = false, length = 100)
    private String videoId;

    @Column(name = "video_key", length = 100)
    private String key;

    @Column(length = 255)
    private String name;

    @Column(length = 50)
    private String site;

    private Integer size;

    @Column(length = 50)
    private String type;

    @Column(columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean official = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }
}