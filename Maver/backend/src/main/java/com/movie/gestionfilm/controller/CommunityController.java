package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Post;
import com.movie.gestionfilm.model.Reaction;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import com.movie.gestionfilm.service.CommunityService;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
@CrossOrigin(origins = "*")
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    @GetMapping("/posts/diagnostic")
    public ResponseEntity<?> diagnostic() {
        Map<String, Object> diagnostic = new java.util.HashMap<>();
        diagnostic.put("backend_running", true);
        diagnostic.put("timestamp", java.time.LocalDateTime.now().toString());

        try {

            List<Post> posts = communityService.getAllPosts();
            diagnostic.put("posts_from_service", posts != null ? posts.size() : 0);
            diagnostic.put("service_status", "OK");
            diagnostic.put("message", "Backend is running. " + 
                (posts != null && posts.size() > 0 ? 
                    posts.size() + " posts found in database." : 
                    "No posts found - this is normal if no posts have been created yet."));
        } catch (Exception e) {
            diagnostic.put("service_status", "ERROR");
            diagnostic.put("service_error", e.getMessage());
            diagnostic.put("error_details", e.getClass().getSimpleName());
        }

        return ResponseEntity.ok(diagnostic);
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            System.out.println("=== CONTROLLER: GET ALL POSTS REQUEST ===");
            System.out.println("Reading posts from DATABASE - posts are PERMANENTLY STORED");

            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Unauthorized");
                error.put("message", "You must be logged in to view posts");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            List<Post> posts = communityService.getAllPosts();

            if (posts == null) {
                System.out.println("WARNING: Service returned null posts list");
                posts = new java.util.ArrayList<>();
            }

            System.out.println("=== CONTROLLER: Processing Posts ===");
            System.out.println("Total posts received from DATABASE: " + posts.size());

            List<Map<String, Object>> postData = posts.stream()
            .filter(post -> {

                if (post.getUser() == null) {
                    System.err.println("WARNING: Post " + post.getId() + " has null user - SKIPPING");
                    return false;
                }
                if (post.getId() == null) {
                    System.err.println("WARNING: Post has null ID - SKIPPING");
                    return false;
                }
                return true;
            })
            .map(post -> {

                try {
                    if (post.getMentionedMovies() != null) {
                        post.getMentionedMovies().size(); 

                        for (var movie : post.getMentionedMovies()) {
                            movie.getTmdbId();
                        }
                    }
                    if (post.getMentionedActors() != null) {
                        post.getMentionedActors().size(); 

                        for (var actor : post.getMentionedActors()) {
                            actor.getTmdbId();
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error initializing collections for post " + post.getId() + ": " + e.getMessage());
                }

                Map<String, Object> postMap = new java.util.HashMap<>();
                postMap.put("id", post.getId());
                postMap.put("content", post.getContent());
                postMap.put("createdAt", post.getCreatedAt());

                Map<String, Object> userMap = new java.util.HashMap<>();
                userMap.put("id", post.getUser().getId());
                userMap.put("nom", post.getUser().getNom());
                userMap.put("email", post.getUser().getEmail());
                if (post.getUser().getProfilePicture() != null) {
                    userMap.put("profilePicture", post.getUser().getProfilePicture());
                }
                postMap.put("user", userMap);

                List<Map<String, Object>> movies = new java.util.ArrayList<>();
                try {
                    if (post.getMentionedMovies() != null && !post.getMentionedMovies().isEmpty()) {
                        System.out.println("Post " + post.getId() + " has " + post.getMentionedMovies().size() + " movies");
                        movies = post.getMentionedMovies().stream().map(movie -> {
                            Map<String, Object> movieMap = new java.util.HashMap<>();
                            movieMap.put("tmdbId", movie.getTmdbId());
                            movieMap.put("title", movie.getTitle() != null ? movie.getTitle() : "");
                            movieMap.put("posterPath", movie.getPosterPath() != null ? movie.getPosterPath() : "");
                            return movieMap;
                        }).collect(Collectors.toList());
                    } else {
                        System.out.println("Post " + post.getId() + " has no movies (null or empty)");
                    }
                } catch (Exception e) {
                    System.err.println("Error processing movies for post " + post.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
                postMap.put("mentionedMovies", movies);

                List<Map<String, Object>> actors = new java.util.ArrayList<>();
                try {
                    if (post.getMentionedActors() != null && !post.getMentionedActors().isEmpty()) {
                        System.out.println("Post " + post.getId() + " has " + post.getMentionedActors().size() + " actors");
                        actors = post.getMentionedActors().stream().map(actor -> {
                            Map<String, Object> actorMap = new java.util.HashMap<>();
                            actorMap.put("tmdbId", actor.getTmdbId());
                            actorMap.put("name", actor.getName() != null ? actor.getName() : "");
                            actorMap.put("profilePath", actor.getProfilePath() != null ? actor.getProfilePath() : "");
                            return actorMap;
                        }).collect(Collectors.toList());
                    } else {
                        System.out.println("Post " + post.getId() + " has no actors (null or empty)");
                    }
                } catch (Exception e) {
                    System.err.println("Error processing actors for post " + post.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
                postMap.put("mentionedActors", actors);

                Map<String, Long> counts = new java.util.HashMap<>();
                try {
                    Map<Reaction.ReactionType, Long> reactionCounts = communityService.getReactionCounts(post.getId());
                    counts.put("LOVE", reactionCounts.get(Reaction.ReactionType.LOVE));
                    counts.put("THUMBS_UP", reactionCounts.get(Reaction.ReactionType.THUMBS_UP));
                    counts.put("SAD", reactionCounts.get(Reaction.ReactionType.SAD));
                    counts.put("ANGRY", reactionCounts.get(Reaction.ReactionType.ANGRY));
                } catch (Exception e) {

                    System.err.println("Error getting reaction counts for post " + post.getId() + ": " + e.getMessage());
                    counts.put("LOVE", 0L);
                    counts.put("THUMBS_UP", 0L);
                    counts.put("SAD", 0L);
                    counts.put("ANGRY", 0L);
                }
                postMap.put("reactionCounts", counts);

                try {
                    Optional<Reaction> userReaction = communityService.getUserReaction(post.getId(), userOpt.get().getId());
                    if (userReaction.isPresent()) {
                        postMap.put("userReaction", userReaction.get().getReactionType().name());
                    } else {
                        postMap.put("userReaction", null);
                    }
                } catch (Exception e) {

                    System.err.println("Error getting user reaction for post " + post.getId() + ": " + e.getMessage());
                    postMap.put("userReaction", null);
                }

                return postMap;
            })
            .filter(postMap -> postMap != null) 
            .collect(Collectors.toList());

            return ResponseEntity.ok(postData);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", "Error fetching posts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Unauthorized");
                error.put("message", "You must be logged in to create a post");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String content = (String) request.get("content");
            @SuppressWarnings("unchecked")
            List<Integer> movieTmdbIds = (List<Integer>) request.get("movieTmdbIds");
            @SuppressWarnings("unchecked")
            List<Integer> actorTmdbIds = (List<Integer>) request.get("actorTmdbIds");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> movieData = (List<Map<String, Object>>) request.get("movieData");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> actorData = (List<Map<String, Object>>) request.get("actorData");

            if (content == null || content.trim().isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Validation failed");
                error.put("message", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Post post = communityService.createPost(userOpt.get().getId(), content, movieTmdbIds, actorTmdbIds, movieData, actorData);

            Map<String, Object> postMap = new java.util.HashMap<>();
            postMap.put("id", post.getId());
            postMap.put("content", post.getContent());
            postMap.put("createdAt", post.getCreatedAt());

            Map<String, Object>             userMap = new java.util.HashMap<>();
            userMap.put("id", post.getUser().getId());
            userMap.put("nom", post.getUser().getNom());
            userMap.put("email", post.getUser().getEmail());
            if (post.getUser().getProfilePicture() != null) {
                userMap.put("profilePicture", post.getUser().getProfilePicture());
            }
            postMap.put("user", userMap);

            List<Map<String, Object>> movies = new java.util.ArrayList<>();
            if (post.getMentionedMovies() != null && !post.getMentionedMovies().isEmpty()) {
                movies = post.getMentionedMovies().stream().map(movie -> {
                    Map<String, Object> movieMap = new java.util.HashMap<>();
                    movieMap.put("tmdbId", movie.getTmdbId());
                    movieMap.put("title", movie.getTitle() != null ? movie.getTitle() : "");
                    movieMap.put("posterPath", movie.getPosterPath() != null ? movie.getPosterPath() : "");
                    return movieMap;
                }).collect(Collectors.toList());
            }
            postMap.put("mentionedMovies", movies);

            List<Map<String, Object>> actors = new java.util.ArrayList<>();
            if (post.getMentionedActors() != null && !post.getMentionedActors().isEmpty()) {
                actors = post.getMentionedActors().stream().map(actor -> {
                    Map<String, Object> actorMap = new java.util.HashMap<>();
                    actorMap.put("tmdbId", actor.getTmdbId());
                    actorMap.put("name", actor.getName() != null ? actor.getName() : "");
                    actorMap.put("profilePath", actor.getProfilePath() != null ? actor.getProfilePath() : "");
                    return actorMap;
                }).collect(Collectors.toList());
            }
            postMap.put("mentionedActors", actors);

            Map<String, Long> counts = new java.util.HashMap<>();
            counts.put("LOVE", 0L);
            counts.put("THUMBS_UP", 0L);
            counts.put("SAD", 0L);
            counts.put("ANGRY", 0L);
            postMap.put("reactionCounts", counts);
            postMap.put("userReaction", null);

            return ResponseEntity.status(HttpStatus.CREATED).body(postMap);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", "Error creating post: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/posts/{postId}/reactions")
    public ResponseEntity<?> addOrUpdateReaction(
            @PathVariable Integer postId,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            String reactionTypeStr = request.get("reactionType");
            if (reactionTypeStr == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("reactionType is required");
            }

            Reaction.ReactionType reactionType;
            try {
                reactionType = Reaction.ReactionType.valueOf(reactionTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid reaction type");
            }

            Reaction reaction = communityService.addOrUpdateReaction(postId, userOpt.get().getId(), reactionType);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", reaction.getId());
            response.put("reactionType", reaction.getReactionType().name());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding reaction: " + e.getMessage());
        }
    }

    @DeleteMapping("/posts/{postId}/reactions")
    public ResponseEntity<?> removeReaction(
            @PathVariable Integer postId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            communityService.removeReaction(postId, userOpt.get().getId());
            return ResponseEntity.ok(Map.of("message", "Reaction removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error removing reaction: " + e.getMessage());
        }
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable Integer postId,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Unauthorized");
                error.put("message", "You must be logged in to update a post");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            String content = (String) request.get("content");
            @SuppressWarnings("unchecked")
            List<Integer> movieTmdbIds = (List<Integer>) request.get("movieTmdbIds");
            @SuppressWarnings("unchecked")
            List<Integer> actorTmdbIds = (List<Integer>) request.get("actorTmdbIds");

            if (content == null || content.trim().isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Validation failed");
                error.put("message", "Content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Post post = communityService.updatePost(postId, userOpt.get().getId(), content, movieTmdbIds, actorTmdbIds);

            Map<String, Object> postMap = new java.util.HashMap<>();
            postMap.put("id", post.getId());
            postMap.put("content", post.getContent());
            postMap.put("createdAt", post.getCreatedAt());

            Map<String, Object>             userMap = new java.util.HashMap<>();
            userMap.put("id", post.getUser().getId());
            userMap.put("nom", post.getUser().getNom());
            userMap.put("email", post.getUser().getEmail());
            if (post.getUser().getProfilePicture() != null) {
                userMap.put("profilePicture", post.getUser().getProfilePicture());
            }
            postMap.put("user", userMap);

            List<Map<String, Object>> movies = new java.util.ArrayList<>();
            if (post.getMentionedMovies() != null && !post.getMentionedMovies().isEmpty()) {
                movies = post.getMentionedMovies().stream().map(movie -> {
                    Map<String, Object> movieMap = new java.util.HashMap<>();
                    movieMap.put("tmdbId", movie.getTmdbId());
                    movieMap.put("title", movie.getTitle() != null ? movie.getTitle() : "");
                    movieMap.put("posterPath", movie.getPosterPath() != null ? movie.getPosterPath() : "");
                    return movieMap;
                }).collect(Collectors.toList());
            }
            postMap.put("mentionedMovies", movies);

            List<Map<String, Object>> actors = new java.util.ArrayList<>();
            if (post.getMentionedActors() != null && !post.getMentionedActors().isEmpty()) {
                actors = post.getMentionedActors().stream().map(actor -> {
                    Map<String, Object> actorMap = new java.util.HashMap<>();
                    actorMap.put("tmdbId", actor.getTmdbId());
                    actorMap.put("name", actor.getName() != null ? actor.getName() : "");
                    actorMap.put("profilePath", actor.getProfilePath() != null ? actor.getProfilePath() : "");
                    return actorMap;
                }).collect(Collectors.toList());
            }
            postMap.put("mentionedActors", actors);

            Map<Reaction.ReactionType, Long> reactionCounts = communityService.getReactionCounts(post.getId());
            Map<String, Long> counts = new java.util.HashMap<>();
            counts.put("LOVE", reactionCounts.get(Reaction.ReactionType.LOVE));
            counts.put("THUMBS_UP", reactionCounts.get(Reaction.ReactionType.THUMBS_UP));
            counts.put("SAD", reactionCounts.get(Reaction.ReactionType.SAD));
            counts.put("ANGRY", reactionCounts.get(Reaction.ReactionType.ANGRY));
            postMap.put("reactionCounts", counts);

            Optional<Reaction> userReaction = communityService.getUserReaction(post.getId(), userOpt.get().getId());
            if (userReaction.isPresent()) {
                postMap.put("userReaction", userReaction.get().getReactionType().name());
            } else {
                postMap.put("userReaction", null);
            }

            return ResponseEntity.ok(postMap);
        } catch (RuntimeException e) {

            if (e.getMessage() != null && e.getMessage().contains("only edit your own")) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Permission denied");
                error.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Bad request");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", "Error updating post: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable Integer postId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Unauthorized");
                error.put("message", "You must be logged in to delete a post");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            communityService.deletePost(postId, userOpt.get().getId());
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Post deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {

            if (e.getMessage() != null && e.getMessage().contains("only delete your own")) {
                Map<String, String> error = new java.util.HashMap<>();
                error.put("error", "Permission denied");
                error.put("message", e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Bad request");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new java.util.HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", "Error deleting post: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}