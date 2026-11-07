package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Commentaire;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import com.movie.gestionfilm.service.CommentaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.movie.gestionfilm.model.Film;
import com.movie.gestionfilm.model.Acteur;

@RestController
@RequestMapping("/api/commentaires")
@CrossOrigin(origins = "*")
public class CommentaireController {

    @Autowired
    private CommentaireService commentaireService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @GetMapping
    public ResponseEntity<List<Commentaire>> getAllCommentaires() {
        try {
            List<Commentaire> commentaires = commentaireService.getAllCommentaires();
            return ResponseEntity.ok(commentaires);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Commentaire> getCommentaireById(@PathVariable Integer id) {
        try {
            Optional<Commentaire> commentaire = commentaireService.getCommentaireById(id);
            return commentaire.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/film/{filmId}")
    public ResponseEntity<List<Commentaire>> getCommentairesByFilmId(@PathVariable String filmId) {
        try {

            Integer filmIdInt = null;
            try {
                filmIdInt = Integer.parseInt(filmId);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (filmIdInt > 10000) {
                List<Commentaire> commentaires = commentaireService.getCommentairesByTmdbFilmId(filmIdInt);
                return ResponseEntity.ok(commentaires);
            } else {

                List<Commentaire> commentaires = commentaireService.getCommentairesByFilmId(filmIdInt);
                return ResponseEntity.ok(commentaires);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/acteur/{acteurId}")
    public ResponseEntity<List<Commentaire>> getCommentairesByActeurId(@PathVariable String acteurId) {
        try {

            Integer acteurIdInt = null;
            try {
                acteurIdInt = Integer.parseInt(acteurId);
            } catch (NumberFormatException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (acteurIdInt > 10000) {
                List<Commentaire> commentaires = commentaireService.getCommentairesByTmdbActeurId(acteurIdInt);
                return ResponseEntity.ok(commentaires);
            } else {

                List<Commentaire> commentaires = commentaireService.getCommentairesByActeurId(acteurIdInt);
                return ResponseEntity.ok(commentaires);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createCommentaire(
            @RequestBody Map<String, Object> requestBody,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {

            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to post comments");
            }

            Commentaire commentaire = new Commentaire();
            commentaire.setFan(userOpt.get());

            if (requestBody.containsKey("film")) {
                Object filmObj = requestBody.get("film");
                if (filmObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> filmMap = (Map<String, Object>) filmObj;
                    Object filmIdObj = filmMap.get("id");

                    if (filmIdObj != null) {
                        Integer filmId = null;
                        if (filmIdObj instanceof Integer) {
                            filmId = (Integer) filmIdObj;
                        } else if (filmIdObj instanceof String) {
                            try {
                                filmId = Integer.parseInt((String) filmIdObj);
                            } catch (NumberFormatException e) {

                                try {
                                    Integer tmdbId = Integer.parseInt((String) filmIdObj);
                                    commentaire.setTmdbFilmId(tmdbId);
                                } catch (NumberFormatException e2) {

                                }
                                filmId = null;
                            }
                        } else if (filmIdObj instanceof Number) {
                            filmId = ((Number) filmIdObj).intValue();
                        }

                        if (filmId != null && filmId > 10000) {
                            commentaire.setTmdbFilmId(filmId);

                        } else if (filmId != null && filmId > 0) {

                            Film film = new Film();
                            film.setId(filmId);
                            commentaire.setFilm(film);

                        }
                    }
                }
            }

            if (requestBody.containsKey("acteur")) {
                Object acteurObj = requestBody.get("acteur");
                if (acteurObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> acteurMap = (Map<String, Object>) acteurObj;
                    Object acteurIdObj = acteurMap.get("id");
                    if (acteurIdObj != null) {
                        Integer acteurId = null;
                        if (acteurIdObj instanceof Integer) {
                            acteurId = (Integer) acteurIdObj;
                        } else if (acteurIdObj instanceof Number) {
                            acteurId = ((Number) acteurIdObj).intValue();
                        }
                        if (acteurId != null) {
                            Acteur acteur = new Acteur();
                            acteur.setId(acteurId);
                            commentaire.setActeur(acteur);
                        }
                    }
                }
            }

            if (requestBody.containsKey("tmdbActeurId")) {
                Object tmdbActeurIdObj = requestBody.get("tmdbActeurId");
                if (tmdbActeurIdObj instanceof Integer) {
                    commentaire.setTmdbActeurId((Integer) tmdbActeurIdObj);
                } else if (tmdbActeurIdObj instanceof Number) {
                    commentaire.setTmdbActeurId(((Number) tmdbActeurIdObj).intValue());
                } else if (tmdbActeurIdObj instanceof String) {
                    try {
                        commentaire.setTmdbActeurId(Integer.parseInt((String) tmdbActeurIdObj));
                    } catch (NumberFormatException e) {

                    }
                }
            }

            if (requestBody.containsKey("note")) {
                Object noteObj = requestBody.get("note");
                if (noteObj instanceof Number) {
                    commentaire.setNote(((Number) noteObj).intValue());
                }
            }

            if (requestBody.containsKey("commentaire")) {
                commentaire.setCommentaire((String) requestBody.get("commentaire"));
            }

            Commentaire createdCommentaire = commentaireService.createCommentaire(commentaire);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCommentaire);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating commentaire: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCommentaire(@PathVariable Integer id, @RequestBody Commentaire commentaireDetails) {
        try {
            Commentaire updatedCommentaire = commentaireService.updateCommentaire(id, commentaireDetails);
            return ResponseEntity.ok(updatedCommentaire);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating commentaire: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCommentaire(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {

            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            commentaireService.deleteCommentaire(id, userOpt.get().getId());
            return ResponseEntity.ok().body("Commentaire deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting commentaire: " + e.getMessage());
        }
    }

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<io.jsonwebtoken.Claims> claims = com.movie.gestionfilm.security.JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }
}