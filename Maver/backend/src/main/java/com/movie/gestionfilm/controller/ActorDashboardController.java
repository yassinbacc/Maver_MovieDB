package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.*;
import com.movie.gestionfilm.repository.*;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/actor-dashboard")
@CrossOrigin(origins = "*")
public class ActorDashboardController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private ActeurRepository acteurRepository;

    @Autowired
    private CommentaireRepository commentaireRepository;

    @Autowired
    private TmdbActorRepository tmdbActorRepository;

    @Autowired
    private com.movie.gestionfilm.service.TmdbService tmdbService;

    @Value("${tmdb.api.key:b2524dcdf8e11a2cb256f322b5cef254}")
    private String tmdbApiKey;

    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";
    private static final String TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    @GetMapping("/movies")
    public ResponseEntity<?> getActorMovies(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Utilisateur user = userOpt.get();
            if (user.getRole() != Utilisateur.Role.acteur) {
                return ResponseEntity.status(403).body("Access denied. Actor role required.");
            }

            String actorName = user.getNom();
            System.out.println("Looking for actor with name: " + actorName);
            if (actorName == null || actorName.trim().isEmpty()) {
                System.out.println("Actor name is empty");
                return ResponseEntity.ok(Collections.emptyList());
            }

            Optional<Acteur> acteurOpt = acteurRepository.findByUtilisateur(user);
            Integer tmdbActorId = null;

            if (acteurOpt.isPresent() && acteurOpt.get().getTmdbId() != null) {
                tmdbActorId = acteurOpt.get().getTmdbId();
                System.out.println("Found tmdb_id from acteurs table: " + tmdbActorId);
            }

            Optional<TmdbActor> tmdbActorOpt = Optional.empty();

            if (tmdbActorId != null) {
                tmdbActorOpt = tmdbActorRepository.findByTmdbId(tmdbActorId);
                if (tmdbActorOpt.isPresent()) {
                    System.out.println("Found actor by tmdb_id: " + tmdbActorId);
                }
            }

            if (tmdbActorOpt.isEmpty()) {
                tmdbActorOpt = tmdbActorRepository.findByNameIgnoreCase(actorName.trim());
                if (tmdbActorOpt.isEmpty()) {
                    System.out.println("Exact match not found, trying partial match for: " + actorName.trim());

                    List<TmdbActor> actors = tmdbActorRepository.findByNameContainingIgnoreCase(actorName.trim());
                    System.out.println("Found " + actors.size() + " actors with partial match");
                    if (!actors.isEmpty()) {

                        tmdbActorOpt = Optional.of(actors.get(0));
                    }
                }
            }

            if (tmdbActorOpt.isEmpty() && tmdbActorId != null) {
                System.out.println("Actor not found in tmdb_actors table, using tmdb_id directly: " + tmdbActorId);

            } else if (tmdbActorOpt.isEmpty()) {
                System.out.println("No actors found in database with name: " + actorName.trim() + " and no tmdb_id available");

                System.out.println("Attempting to search TMDB by name and auto-setup actor...");
                try {
                    Integer foundTmdbId = tmdbService.searchActorByName(actorName.trim());
                    if (foundTmdbId != null) {
                        System.out.println("Found actor in TMDB, setting up automatically...");

                        Acteur acteur;
                        if (acteurOpt.isPresent()) {
                            acteur = acteurOpt.get();
                            acteur.setTmdbId(foundTmdbId);
                            acteur = acteurRepository.save(acteur);
                        } else {

                            try {
                                com.movie.gestionfilm.model.TmdbActor tmdbActorData = tmdbService.fetchAndStoreActor(foundTmdbId);
                                acteur = new Acteur();
                                acteur.setUtilisateur(user);
                                acteur.setTmdbId(foundTmdbId);

                                if (tmdbActorData.getBirthday() != null) {
                                    acteur.setDateNaissance(tmdbActorData.getBirthday());
                                } else {
                                    acteur.setDateNaissance(java.time.LocalDate.now().minusYears(30)); 
                                }
                                if (tmdbActorData.getPlaceOfBirth() != null && !tmdbActorData.getPlaceOfBirth().isEmpty()) {

                                    String placeOfBirth = tmdbActorData.getPlaceOfBirth();
                                    String[] parts = placeOfBirth.split(",");
                                    acteur.setNationalite(parts.length > 0 ? parts[parts.length - 1].trim() : "Unknown");
                                } else {
                                    acteur.setNationalite("Unknown");
                                }
                                acteur = acteurRepository.save(acteur);
                            } catch (Exception e) {
                                System.err.println("Error creating acteur entry: " + e.getMessage());

                                acteur = new Acteur();
                                acteur.setUtilisateur(user);
                                acteur.setTmdbId(foundTmdbId);
                                acteur.setDateNaissance(java.time.LocalDate.now().minusYears(30));
                                acteur.setNationalite("Unknown");
                                acteur = acteurRepository.save(acteur);
                            }
                        }

                        if (!acteurOpt.isPresent()) {

                            tmdbService.fetchAndStoreActorFilmography(foundTmdbId);
                        } else {

                            tmdbService.fetchAndStoreActor(foundTmdbId);
                            tmdbService.fetchAndStoreActorFilmography(foundTmdbId);
                        }
                        tmdbActorId = foundTmdbId;
                        System.out.println("Auto-setup successful. Using tmdb_id: " + tmdbActorId);
                    } else {
                        System.out.println("Could not find actor in TMDB by name: " + actorName.trim());
                        return ResponseEntity.ok(Collections.emptyList());
                    }
                } catch (Exception autoSetupError) {
                    System.err.println("Auto-setup failed: " + autoSetupError.getMessage());
                    autoSetupError.printStackTrace();
                    return ResponseEntity.ok(Collections.emptyList());
                }
            } else {
                TmdbActor tmdbActor = tmdbActorOpt.get();
                tmdbActorId = tmdbActor.getTmdbId();
                System.out.println("Found actor: " + tmdbActor.getName() + " with TMDB ID: " + tmdbActorId);
            }

            if (tmdbActorId == null) {
                System.out.println("No TMDB ID available for actor: " + actorName);

                if (acteurOpt.isPresent() && acteurOpt.get().getTmdbId() != null) {
                    System.out.println("Actor has tmdb_id but not synced yet. Attempting auto-sync...");
                    try {
                        tmdbService.fetchAndStoreActor(acteurOpt.get().getTmdbId());
                        tmdbService.fetchAndStoreActorFilmography(acteurOpt.get().getTmdbId());
                        tmdbActorId = acteurOpt.get().getTmdbId();
                        System.out.println("Auto-sync successful. Using tmdb_id: " + tmdbActorId);
                    } catch (Exception syncError) {
                        System.err.println("Auto-sync failed: " + syncError.getMessage());
                        syncError.printStackTrace();
                        return ResponseEntity.ok(Collections.emptyList());
                    }
                } else {
                    return ResponseEntity.ok(Collections.emptyList());
                }
            }

            List<Map<String, Object>> movies = new ArrayList<>();
            try {

                String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/person/" + tmdbActorId)
                    .queryParam("api_key", tmdbApiKey)
                    .queryParam("append_to_response", "combined_credits")
                    .toUriString();

                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                JsonNode actorData = objectMapper.readTree(response.getBody());

                JsonNode castNode = actorData.get("combined_credits");
                if (castNode != null && castNode.has("cast")) {
                    JsonNode castArray = castNode.get("cast");
                    Set<Integer> addedMovieIds = new HashSet<>(); 

                    for (JsonNode movieNode : castArray) {
                        try {

                            String mediaType = movieNode.has("media_type") ? movieNode.get("media_type").asText() : "movie";
                            if (!"movie".equals(mediaType)) {
                                continue; 
                            }

                            Integer movieTmdbId = movieNode.has("id") ? movieNode.get("id").asInt() : null;
                            if (movieTmdbId == null || addedMovieIds.contains(movieTmdbId)) {
                                continue; 
                            }

                            String posterPath = movieNode.has("poster_path") && !movieNode.get("poster_path").isNull()
                                ? movieNode.get("poster_path").asText() : null;
                            String title = movieNode.has("title") ? movieNode.get("title").asText() : null;
                            String releaseDate = movieNode.has("release_date") && !movieNode.get("release_date").isNull()
                                ? movieNode.get("release_date").asText() : null;

                            if (posterPath == null || title == null || releaseDate == null) {
                                System.out.println("Skipping movie (missing basic info): " + title + " (TMDB ID: " + movieTmdbId + ")");
                                continue;
                            }

                            try {
                                String movieUrl = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/movie/" + movieTmdbId)
                                    .queryParam("api_key", tmdbApiKey)
                                    .queryParam("append_to_response", "videos")
                                    .toUriString();

                                ResponseEntity<String> movieResponse = restTemplate.getForEntity(movieUrl, String.class);
                                JsonNode fullMovieData = objectMapper.readTree(movieResponse.getBody());

                                String overview = fullMovieData.has("overview") ? fullMovieData.get("overview").asText() : null;
                                if (overview == null || overview.trim().length() < 20) {
                                    System.out.println("Skipping movie (insufficient overview): " + title + " (TMDB ID: " + movieTmdbId + ")");
                                    continue;
                                }

                                boolean hasTrailer = false;
                                if (fullMovieData.has("videos") && fullMovieData.get("videos").has("results")) {
                                    JsonNode videos = fullMovieData.get("videos").get("results");
                                    for (JsonNode video : videos) {
                                        String videoType = video.has("type") ? video.get("type").asText() : "";
                                        String videoSite = video.has("site") ? video.get("site").asText() : "";
                                        if ("Trailer".equals(videoType) && "YouTube".equals(videoSite)) {
                                            hasTrailer = true;
                                            break;
                                        }
                                    }
                                }

                                if (!hasTrailer) {
                                    System.out.println("Skipping movie (no trailer): " + title + " (TMDB ID: " + movieTmdbId + ")");
                                    continue;
                                }

                                addedMovieIds.add(movieTmdbId);

                                Map<String, Object> movieData = new HashMap<>();
                                movieData.put("tmdbId", movieTmdbId);
                                movieData.put("id", movieTmdbId.toString());
                                movieData.put("title", title);
                                movieData.put("releaseDate", releaseDate);
                                movieData.put("posterPath", posterPath);
                                movieData.put("posterUrl", TMDB_IMAGE_BASE + posterPath);
                                movieData.put("characterName", movieNode.has("character") && !movieNode.get("character").isNull()
                                    ? movieNode.get("character").asText() : "N/A");
                                movieData.put("creditOrder", movieNode.has("order") ? movieNode.get("order").asInt() : 0);

                                movies.add(movieData);
                                System.out.println("Added valid movie: " + title + " (TMDB ID: " + movieTmdbId + ")");
                            } catch (Exception movieFetchError) {
                                System.err.println("Error fetching full details for movie " + movieTmdbId + ": " + movieFetchError.getMessage());

                                continue;
                            }
                        } catch (Exception e) {
                            System.err.println("Error processing movie from TMDB API: " + e.getMessage());
                        }
                    }
                }

                System.out.println("Total movies fetched from TMDB API: " + movies.size());

                movies.sort((a, b) -> {
                    String dateA = (String) a.get("releaseDate");
                    String dateB = (String) b.get("releaseDate");
                    if (dateA == null) return 1;
                    if (dateB == null) return -1;
                    return dateB.compareTo(dateA);
                });

            } catch (Exception e) {
                System.err.println("Error fetching actor filmography from TMDB API: " + e.getMessage());
                e.printStackTrace();

                return ResponseEntity.ok(Collections.emptyList());
            }

            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            System.err.println("Error fetching actor movies: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch actor movies", "message", e.getMessage()));
        }
    }

    @GetMapping("/comments")
    public ResponseEntity<?> getActorComments(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Utilisateur user = userOpt.get();
            if (user.getRole() != Utilisateur.Role.acteur) {
                return ResponseEntity.status(403).body("Access denied. Actor role required.");
            }

            Optional<Acteur> acteurOpt = acteurRepository.findByUtilisateur(user);
            if (acteurOpt.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            Acteur acteur = acteurOpt.get();

            List<Commentaire> commentaires = commentaireRepository.findByActeurId(acteur.getId());

            List<Map<String, Object>> comments = commentaires.stream().map(comment -> {
                Map<String, Object> commentData = new HashMap<>();
                commentData.put("id", comment.getId());
                commentData.put("fanName", comment.getFan().getNom());
                commentData.put("fanEmail", comment.getFan().getEmail());
                commentData.put("note", comment.getNote());
                commentData.put("commentaire", comment.getCommentaire());
                commentData.put("dateCommentaire", comment.getDateCommentaire());
                if (comment.getFilm() != null) {
                    commentData.put("filmTitle", comment.getFilm().getTitre());
                    commentData.put("filmId", comment.getFilm().getId());
                }
                return commentData;
            }).collect(Collectors.toList());

            comments.sort((a, b) -> {
                LocalDateTime dateA = (LocalDateTime) a.get("dateCommentaire");
                LocalDateTime dateB = (LocalDateTime) b.get("dateCommentaire");
                if (dateA == null) return 1;
                if (dateB == null) return -1;
                return dateB.compareTo(dateA);
            });

            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            System.err.println("Error fetching actor comments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch actor comments", "message", e.getMessage()));
        }
    }
}