package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "watchlist_movies", uniqueConstraints = {
        @UniqueConstraint(name = "unique_movie_per_list", columnNames = {"watchlist_id", "film_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistMovie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watchlist_id", nullable = false)
    @JsonIgnore
    private Watchlist watchlist;

    @Column(name = "film_id", nullable = false, length = 20)
    private String filmId;

    @Column(name = "rank_num", nullable = false)
    private Integer rankNum;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private Instant createdAt;
}