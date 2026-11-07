package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.*;
import com.movie.gestionfilm.repository.*;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlists")
@CrossOrigin(origins = "*")
public class WatchlistsController {

    @Autowired private WatchlistRepository watchlistRepository;
    @Autowired private WatchlistMovieRepository watchlistMovieRepository;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private TmdbMovieRepository tmdbMovieRepository;
    @Autowired private com.movie.gestionfilm.repository.FriendRequestRepository friendRequestRepository;

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        List<Watchlist> lists = watchlistRepository.findByUtilisateur(userOpt.get());

        List<Map<String, Object>> enrichedLists = lists.stream().map(list -> {
            List<WatchlistMovie> watchlistMovies = watchlistMovieRepository.findByWatchlistOrderByRankNumAsc(list);
            List<Map<String, Object>> enrichedMovies = watchlistMovies.stream().map(wm -> {
                Map<String, Object> movieData = new HashMap<>();
                movieData.put("id", wm.getId());
                movieData.put("filmId", wm.getFilmId());
                movieData.put("rankNum", wm.getRankNum());
                movieData.put("rank", wm.getRankNum());
                movieData.put("createdAt", wm.getCreatedAt());

                try {
                    Integer tmdbId = Integer.parseInt(wm.getFilmId());
                    Optional<TmdbMovie> tmdbMovieOpt = tmdbMovieRepository.findByTmdbId(tmdbId);
                    if (tmdbMovieOpt.isPresent()) {
                        TmdbMovie tmdbMovie = tmdbMovieOpt.get();
                        movieData.put("titre", tmdbMovie.getTitle());
                        movieData.put("title", tmdbMovie.getTitle());
                        movieData.put("annee_sortie", tmdbMovie.getReleaseDate() != null ? 
                            tmdbMovie.getReleaseDate().getYear() : null);
                        movieData.put("url", tmdbMovie.getPosterPath() != null ? 
                            "https://image.tmdb.org/t/p/w500" + tmdbMovie.getPosterPath() : null);
                        movieData.put("posterPath", tmdbMovie.getPosterPath());

                        String genreName = null;
                        try {
                            if (tmdbMovie.getGenres() != null && !tmdbMovie.getGenres().isEmpty()) {
                                var firstGenre = tmdbMovie.getGenres().get(0);
                                if (firstGenre != null && firstGenre.getGenre() != null) {
                                    genreName = firstGenre.getGenre().getName();
                                }
                            }
                        } catch (Exception e) {

                        }
                        movieData.put("genre", genreName);
                    } else {

                        movieData.put("titre", wm.getFilmId());
                        movieData.put("title", wm.getFilmId());
                        movieData.put("annee_sortie", null);
                        movieData.put("url", null);
                        movieData.put("posterPath", null);
                        movieData.put("genre", null);
                    }
                } catch (NumberFormatException e) {

                    movieData.put("titre", wm.getFilmId());
                    movieData.put("title", wm.getFilmId());
                    movieData.put("annee_sortie", null);
                    movieData.put("url", null);
                    movieData.put("posterPath", null);
                    movieData.put("genre", null);
                }

                return movieData;
            }).collect(Collectors.toList());

            Map<String, Object> listData = new HashMap<>();
            listData.put("id", list.getId());
            listData.put("name", list.getName());
            listData.put("createdAt", list.getCreatedAt());
            listData.put("movies", enrichedMovies);
            return listData;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enrichedLists);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, String> body,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
            String name = Optional.ofNullable(body.get("name")).map(String::trim).orElse("");
            if (name.isEmpty()) return ResponseEntity.badRequest().body("Name is required");
            if (watchlistRepository.existsByUtilisateurAndName(userOpt.get(), name)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("A list with this name already exists");
            }
            Watchlist wl = new Watchlist();
            wl.setUtilisateur(userOpt.get());
            wl.setName(name);
            Watchlist saved = watchlistRepository.save(wl);
            watchlistRepository.flush(); 
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("name", saved.getName());
            response.put("createdAt", saved.getCreatedAt());
            response.put("movies", new ArrayList<>());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("Error creating watchlist: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating watchlist: " + e.getMessage());
        }
    }

    @PutMapping("/{listId}")
    @Transactional
    public ResponseEntity<?> rename(@PathVariable Integer listId,
                                    @RequestBody Map<String, String> body,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
            String name = Optional.ofNullable(body.get("name")).map(String::trim).orElse("");
            if (name.isEmpty()) return ResponseEntity.badRequest().body("Name is required");
            Watchlist wl = watchlistRepository.findByIdAndUtilisateur(listId, userOpt.get())
                    .orElse(null);
            if (wl == null) return ResponseEntity.status(404).body("List not found");
            if (!wl.getName().equals(name) && watchlistRepository.existsByUtilisateurAndName(userOpt.get(), name)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("A list with this name already exists");
            }
            wl.setName(name);
            Watchlist updated = watchlistRepository.save(wl);
            System.out.println("Watchlist updated: ID=" + updated.getId() + ", Name=" + updated.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("Error updating watchlist: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating watchlist: " + e.getMessage());
        }
    }

    @DeleteMapping("/{listId}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Integer listId,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Watchlist wl = watchlistRepository.findByIdAndUtilisateur(listId, userOpt.get())
                .orElse(null);
        if (wl == null) return ResponseEntity.status(404).body("List not found");
        watchlistRepository.delete(wl);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{listId}/movies/{filmId}")
    @Transactional
    public ResponseEntity<?> addMovie(@PathVariable Integer listId,
                                      @PathVariable String filmId,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Watchlist wl = watchlistRepository.findByIdAndUtilisateur(listId, userOpt.get())
                .orElse(null);
        if (wl == null) return ResponseEntity.status(404).body("List not found");
        if (watchlistMovieRepository.existsByWatchlistAndFilmId(wl, filmId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Movie already in list");
        }
        int nextRank = watchlistMovieRepository.findByWatchlistOrderByRankNumAsc(wl).size() + 1;
        WatchlistMovie wm = new WatchlistMovie();
        wm.setWatchlist(wl);
        wm.setFilmId(filmId);
        wm.setRankNum(nextRank);
        WatchlistMovie saved = watchlistMovieRepository.save(wm);
        watchlistMovieRepository.flush();

        Map<String, Object> movieData = new HashMap<>();
        movieData.put("id", saved.getId());
        movieData.put("filmId", saved.getFilmId());
        movieData.put("rankNum", saved.getRankNum());
        movieData.put("rank", saved.getRankNum());
        movieData.put("createdAt", saved.getCreatedAt());

        try {
            Integer tmdbId = Integer.parseInt(filmId);
            Optional<TmdbMovie> tmdbMovieOpt = tmdbMovieRepository.findByTmdbId(tmdbId);
            if (tmdbMovieOpt.isPresent()) {
                TmdbMovie tmdbMovie = tmdbMovieOpt.get();
                movieData.put("titre", tmdbMovie.getTitle());
                movieData.put("title", tmdbMovie.getTitle());
                movieData.put("annee_sortie", tmdbMovie.getReleaseDate() != null ? 
                    tmdbMovie.getReleaseDate().getYear() : null);
                movieData.put("url", tmdbMovie.getPosterPath() != null ? 
                    "https://image.tmdb.org/t/p/w500" + tmdbMovie.getPosterPath() : null);
                movieData.put("posterPath", tmdbMovie.getPosterPath());
                movieData.put("genre", tmdbMovie.getGenres() != null && !tmdbMovie.getGenres().isEmpty() ? 
                    tmdbMovie.getGenres().get(0).getGenre().getName() : null);
            } else {
                movieData.put("titre", filmId);
                movieData.put("title", filmId);
                movieData.put("annee_sortie", null);
                movieData.put("url", null);
                movieData.put("posterPath", null);
                movieData.put("genre", null);
            }
        } catch (NumberFormatException e) {
            movieData.put("titre", filmId);
            movieData.put("title", filmId);
            movieData.put("annee_sortie", null);
            movieData.put("url", null);
            movieData.put("posterPath", null);
            movieData.put("genre", null);
        }

        return ResponseEntity.ok(movieData);
    }

    @DeleteMapping("/{listId}/movies/{filmId}")
    @Transactional
    public ResponseEntity<?> removeMovie(@PathVariable Integer listId,
                                         @PathVariable String filmId,
                                         @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Watchlist wl = watchlistRepository.findByIdAndUtilisateur(listId, userOpt.get())
                .orElse(null);
        if (wl == null) return ResponseEntity.status(404).body("List not found");
        Optional<WatchlistMovie> wmOpt = watchlistMovieRepository.findByWatchlistAndFilmId(wl, filmId);
        if (wmOpt.isEmpty()) return ResponseEntity.status(404).body("Movie not found in list");
        WatchlistMovie wm = wmOpt.orElseThrow(() -> new RuntimeException("Watchlist movie not found"));
        watchlistMovieRepository.delete(wm);

        List<WatchlistMovie> movies = watchlistMovieRepository.findByWatchlistOrderByRankNumAsc(wl);
        for (int i = 0; i < movies.size(); i++) {
            movies.get(i).setRankNum(i + 1);
        }
        watchlistMovieRepository.saveAll(movies);
        watchlistMovieRepository.flush();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{listId}/movies/{filmId}/rank")
    @Transactional
    public ResponseEntity<?> updateRank(@PathVariable Integer listId,
                                        @PathVariable String filmId,
                                        @RequestParam("direction") String direction,
                                        @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Watchlist wl = watchlistRepository.findByIdAndUtilisateur(listId, userOpt.get())
                .orElse(null);
        if (wl == null) return ResponseEntity.status(404).body("List not found");
        List<WatchlistMovie> movies = watchlistMovieRepository.findByWatchlistOrderByRankNumAsc(wl);
        int idx = -1;
        for (int i = 0; i < movies.size(); i++) {
            if (movies.get(i).getFilmId().equals(filmId)) { idx = i; break; }
        }
        if (idx == -1) return ResponseEntity.status(404).body("Movie not found in list");
        if ("up".equalsIgnoreCase(direction) && idx > 0) {
            Collections.swap(movies, idx, idx - 1);
        } else if ("down".equalsIgnoreCase(direction) && idx < movies.size() - 1) {
            Collections.swap(movies, idx, idx + 1);
        } else {
            return ResponseEntity.badRequest().body("Invalid direction or boundary");
        }
        for (int i = 0; i < movies.size(); i++) {
            movies.get(i).setRankNum(i + 1);
        }
        watchlistMovieRepository.saveAll(movies);
        watchlistMovieRepository.flush();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/friend/{friendId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFriendWatchlists(
            @PathVariable Integer friendId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Utilisateur> friendOpt = utilisateurRepository.findById(friendId);
        if (friendOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Friend not found");
        }

        Utilisateur currentUser = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        Utilisateur friend = friendOpt.orElseThrow(() -> new RuntimeException("Friend not found"));

        if (!friendRequestRepository.areFriends(currentUser, friend)) {
            return ResponseEntity.status(403).body("You can only view watchlists of your friends");
        }

        List<Watchlist> lists = watchlistRepository.findByUtilisateur(friend);

        List<Map<String, Object>> enrichedLists = lists.stream().map(list -> {
            List<WatchlistMovie> watchlistMovies = watchlistMovieRepository.findByWatchlistOrderByRankNumAsc(list);
            List<Map<String, Object>> enrichedMovies = watchlistMovies.stream().map(wm -> {
                Map<String, Object> movieData = new HashMap<>();
                movieData.put("id", wm.getId());
                movieData.put("filmId", wm.getFilmId());
                movieData.put("rankNum", wm.getRankNum());
                movieData.put("rank", wm.getRankNum());
                movieData.put("createdAt", wm.getCreatedAt());

                try {
                    Integer tmdbId = Integer.parseInt(wm.getFilmId());
                    Optional<TmdbMovie> tmdbMovieOpt = tmdbMovieRepository.findByTmdbId(tmdbId);
                    if (tmdbMovieOpt.isPresent()) {
                        TmdbMovie tmdbMovie = tmdbMovieOpt.get();
                        movieData.put("titre", tmdbMovie.getTitle());
                        movieData.put("title", tmdbMovie.getTitle());
                        movieData.put("annee_sortie", tmdbMovie.getReleaseDate() != null ? 
                            tmdbMovie.getReleaseDate().getYear() : null);
                        movieData.put("url", tmdbMovie.getPosterPath() != null ? 
                            "https://image.tmdb.org/t/p/w500" + tmdbMovie.getPosterPath() : null);
                        movieData.put("posterPath", tmdbMovie.getPosterPath());

                        String genreName = null;
                        try {
                            if (tmdbMovie.getGenres() != null && !tmdbMovie.getGenres().isEmpty()) {
                                var firstGenre = tmdbMovie.getGenres().get(0);
                                if (firstGenre != null && firstGenre.getGenre() != null) {
                                    genreName = firstGenre.getGenre().getName();
                                }
                            }
                        } catch (Exception e) {

                        }
                        movieData.put("genre", genreName);
                    } else {
                        movieData.put("titre", wm.getFilmId());
                        movieData.put("title", wm.getFilmId());
                        movieData.put("annee_sortie", null);
                        movieData.put("url", null);
                        movieData.put("posterPath", null);
                        movieData.put("genre", null);
                    }
                } catch (NumberFormatException e) {
                    movieData.put("titre", wm.getFilmId());
                    movieData.put("title", wm.getFilmId());
                    movieData.put("annee_sortie", null);
                    movieData.put("url", null);
                    movieData.put("posterPath", null);
                    movieData.put("genre", null);
                }

                return movieData;
            }).collect(Collectors.toList());

            Map<String, Object> listData = new HashMap<>();
            listData.put("id", list.getId());
            listData.put("name", list.getName());
            listData.put("createdAt", list.getCreatedAt());
            listData.put("movies", enrichedMovies);
            return listData;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("friend", Map.of(
            "id", friend.getId(),
            "nom", friend.getNom(),
            "email", friend.getEmail()
        ));
        response.put("watchlists", enrichedLists);

        return ResponseEntity.ok(response);
    }
}