package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.Watchlist;
import com.movie.gestionfilm.model.WatchlistMovie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistMovieRepository extends JpaRepository<WatchlistMovie, Integer> {
    List<WatchlistMovie> findByWatchlistOrderByRankNumAsc(Watchlist watchlist);
    Optional<WatchlistMovie> findByWatchlistAndFilmId(Watchlist watchlist, String filmId);
    boolean existsByWatchlistAndFilmId(Watchlist watchlist, String filmId);
}