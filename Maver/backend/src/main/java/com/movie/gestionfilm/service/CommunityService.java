package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.*;
import com.movie.gestionfilm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CommunityService {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private ReactionRepository reactionRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private TmdbMovieRepository tmdbMovieRepository;
    
    @Autowired
    private TmdbActorRepository tmdbActorRepository;

    @Transactional(readOnly = true)
    public List<Post> getAllPosts() {
        try {

            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();

            if (posts != null && !posts.isEmpty()) {
                for (Post post : posts) {
                    try {

                        if (post.getMentionedMovies() != null && !post.getMentionedMovies().isEmpty()) {
                            for (var movie : post.getMentionedMovies()) {
                                movie.getTmdbId(); 
                            }
                        }
                        if (post.getMentionedActors() != null && !post.getMentionedActors().isEmpty()) {
                            for (var actor : post.getMentionedActors()) {
                                actor.getTmdbId(); 
                            }
                        }
                    } catch (Exception e) {

                    }
                }
            }
            
            return posts != null ? posts : new java.util.ArrayList<>();
        } catch (Exception e) {

            return new java.util.ArrayList<>();
        }
    }

    @Transactional
    public Post createPost(Integer userId, String content, List<Integer> movieTmdbIds, List<Integer> actorTmdbIds, 
                          java.util.List<java.util.Map<String, Object>> movieData, 
                          java.util.List<java.util.Map<String, Object>> actorData) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Post post = new Post();
        post.setUser(user);
        post.setContent(content);

        if (movieTmdbIds != null && !movieTmdbIds.isEmpty()) {

            Integer firstMovieId = movieTmdbIds.get(0);
            if (firstMovieId != null) {

                Optional<TmdbMovie> movieOpt = tmdbMovieRepository.findByTmdbId(firstMovieId);
                TmdbMovie movie;
                
                if (movieOpt.isPresent()) {

                    movie = movieOpt.get();
                } else {

                    movie = new TmdbMovie();
                    movie.setTmdbId(firstMovieId);

                    if (movieData != null && !movieData.isEmpty() && movieData.get(0) != null) {
                        java.util.Map<String, Object> data = movieData.get(0);
                        Object titleObj = data.get("title");
                        movie.setTitle(titleObj != null ? titleObj.toString() : "Movie " + firstMovieId);
                        Object posterPathObj = data.get("posterPath");
                        if (posterPathObj != null) {
                            String posterPath = posterPathObj.toString();
                            if (!posterPath.isEmpty()) {
                                movie.setPosterPath(posterPath);
                            }
                        }
                    } else {
                        movie.setTitle("Movie " + firstMovieId);
                    }

                    try {
                        movie = tmdbMovieRepository.save(movie);
                        tmdbMovieRepository.flush();
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {

                        movie = tmdbMovieRepository.findByTmdbId(firstMovieId)
                            .orElseThrow(() -> new RuntimeException("Failed to create or find movie"));
                    }
                }
                
                post.setMentionedMovies(java.util.Collections.singletonList(movie));
            } else {
                post.setMentionedMovies(new java.util.ArrayList<>());
            }

            post.setMentionedActors(new java.util.ArrayList<>());
        } else {
            post.setMentionedMovies(new java.util.ArrayList<>());
        }

        if (actorTmdbIds != null && !actorTmdbIds.isEmpty()) {

            Integer firstActorId = actorTmdbIds.get(0);
            if (firstActorId != null) {

                Optional<TmdbActor> actorOpt = tmdbActorRepository.findByTmdbId(firstActorId);
                TmdbActor actor;
                
                if (actorOpt.isPresent()) {

                    actor = actorOpt.get();
                } else {

                    actor = new TmdbActor();
                    actor.setTmdbId(firstActorId);

                    if (actorData != null && !actorData.isEmpty() && actorData.get(0) != null) {
                        java.util.Map<String, Object> data = actorData.get(0);
                        Object nameObj = data.get("name");
                        actor.setName(nameObj != null ? nameObj.toString() : "Actor " + firstActorId);
                        Object profilePathObj = data.get("profilePath");
                        if (profilePathObj != null) {
                            String profilePath = profilePathObj.toString();
                            if (!profilePath.isEmpty()) {
                                actor.setProfilePath(profilePath);
                            }
                        }
                    } else {
                        actor.setName("Actor " + firstActorId);
                    }

                    try {
                        actor = tmdbActorRepository.save(actor);
                        tmdbActorRepository.flush();
                    } catch (org.springframework.dao.DataIntegrityViolationException e) {

                        actor = tmdbActorRepository.findByTmdbId(firstActorId)
                            .orElseThrow(() -> new RuntimeException("Failed to create or find actor"));
                    }
                }
                
                post.setMentionedActors(java.util.Collections.singletonList(actor));
            } else {
                post.setMentionedActors(new java.util.ArrayList<>());
            }

            post.setMentionedMovies(new java.util.ArrayList<>());
        } else {
            post.setMentionedActors(new java.util.ArrayList<>());
        }

        Post savedPost = postRepository.save(post);
        postRepository.flush(); 

        if (savedPost.getMentionedMovies() != null) {
            savedPost.getMentionedMovies().size(); 
        }
        if (savedPost.getMentionedActors() != null) {
            savedPost.getMentionedActors().size(); 
        }

        return savedPost;
    }

    public Optional<Post> getPostById(Integer postId) {
        if (postId == null) {
            return Optional.empty();
        }
        return postRepository.findById(postId);
    }

    public Reaction addOrUpdateReaction(Integer postId, Integer userId, Reaction.ReactionType reactionType) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("Post ID and User ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Reaction> existingReaction = reactionRepository.findByPostAndUser(post, user);
        
        if (existingReaction.isPresent()) {

            Reaction reaction = existingReaction.orElseThrow(() -> new RuntimeException("Reaction not found"));
            reaction.setReactionType(reactionType);
            return reactionRepository.save(reaction);
        } else {

            Reaction reaction = new Reaction();
            reaction.setPost(post);
            reaction.setUser(user);
            reaction.setReactionType(reactionType);
            return reactionRepository.save(reaction);
        }
    }

    public void removeReaction(Integer postId, Integer userId) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("Post ID and User ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Optional<Reaction> reaction = reactionRepository.findByPostAndUser(post, user);
        reaction.ifPresent(reactionRepository::delete);
    }

    public java.util.Map<Reaction.ReactionType, Long> getReactionCounts(Integer postId) {
        return java.util.Map.of(
            Reaction.ReactionType.LOVE, reactionRepository.countByPostIdAndReactionType(postId, Reaction.ReactionType.LOVE),
            Reaction.ReactionType.THUMBS_UP, reactionRepository.countByPostIdAndReactionType(postId, Reaction.ReactionType.THUMBS_UP),
            Reaction.ReactionType.SAD, reactionRepository.countByPostIdAndReactionType(postId, Reaction.ReactionType.SAD),
            Reaction.ReactionType.ANGRY, reactionRepository.countByPostIdAndReactionType(postId, Reaction.ReactionType.ANGRY)
        );
    }

    public Optional<Reaction> getUserReaction(Integer postId, Integer userId) {
        if (postId == null || userId == null) {
            return Optional.empty();
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return reactionRepository.findByPostAndUser(post, user);
    }

    public Post updatePost(Integer postId, Integer userId, String content, List<Integer> movieTmdbIds, List<Integer> actorTmdbIds) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("Post ID and User ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getUser() == null || post.getUser().getId() == null || !post.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only edit your own posts");
        }
        
        post.setContent(content);

        boolean updateMovies = movieTmdbIds != null && !movieTmdbIds.isEmpty();
        boolean updateActors = actorTmdbIds != null && !actorTmdbIds.isEmpty();

        if (movieTmdbIds == null) {
            movieTmdbIds = new java.util.ArrayList<>();
        }
        if (actorTmdbIds == null) {
            actorTmdbIds = new java.util.ArrayList<>();
        }

        if (movieTmdbIds != null && movieTmdbIds.isEmpty() && 
            actorTmdbIds != null && actorTmdbIds.isEmpty()) {
            System.out.println("Edit mode: Keeping original mentions - only updating content");

        } else {

            if (updateMovies) {

                Integer firstMovieId = movieTmdbIds.get(0);
                if (firstMovieId != null) {
                    Optional<TmdbMovie> movieOpt = tmdbMovieRepository.findByTmdbId(firstMovieId);
                    if (movieOpt.isPresent()) {

                        post.setMentionedMovies(java.util.Collections.singletonList(movieOpt.get()));
                        post.setMentionedActors(new java.util.ArrayList<>());
                        System.out.println("Updated movie: " + movieOpt.get().getTitle() + " (TMDB ID: " + firstMovieId + ")");
                    } else {
                        System.out.println("Warning: Movie with TMDB ID " + firstMovieId + " not found in database");
                    }
                }
            }

            if (updateActors && actorTmdbIds != null && !actorTmdbIds.isEmpty()) {
                Integer firstActorId = actorTmdbIds.get(0);
                if (firstActorId != null) {
                    Optional<TmdbActor> actorOpt = tmdbActorRepository.findByTmdbId(firstActorId);
                    if (actorOpt.isPresent()) {

                        post.setMentionedActors(java.util.Collections.singletonList(actorOpt.get()));
                        post.setMentionedMovies(new java.util.ArrayList<>());
                        System.out.println("Updated actor: " + actorOpt.get().getName() + " (TMDB ID: " + firstActorId + ")");
                    } else {
                        System.out.println("Warning: Actor with TMDB ID " + firstActorId + " not found in database");
                    }
                }
            }
        }

        Post savedPost = postRepository.save(post);

        postRepository.flush();

        Post reloadedPost = postRepository.findByIdWithUser(savedPost.getId())
            .orElseThrow(() -> new RuntimeException("Failed to reload post after updating"));

        if (reloadedPost.getMentionedMovies() != null) {
            reloadedPost.getMentionedMovies().size(); 
        }
        if (reloadedPost.getMentionedActors() != null) {
            reloadedPost.getMentionedActors().size(); 
        }
        
        System.out.println("Post updated - ID: " + reloadedPost.getId() + 
                         ", User: " + (reloadedPost.getUser() != null ? reloadedPost.getUser().getNom() : "NULL") +
                         ", Movies: " + (reloadedPost.getMentionedMovies() != null ? reloadedPost.getMentionedMovies().size() : 0) +
                         ", Actors: " + (reloadedPost.getMentionedActors() != null ? reloadedPost.getMentionedActors().size() : 0));
        
        return reloadedPost;
    }

    public void deletePost(Integer postId, Integer userId) {
        if (postId == null || userId == null) {
            throw new IllegalArgumentException("Post ID and User ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getUser() == null || post.getUser().getId() == null || !post.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts");
        }
        
        postRepository.delete(post);
    }

    public Post updatePostAsAdmin(Integer postId, String content) {
        if (postId == null) {
            throw new IllegalArgumentException("Post ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        post.setContent(content);
        return postRepository.save(post);
    }

    public void deletePostAsAdmin(Integer postId) {
        if (postId == null) {
            throw new IllegalArgumentException("Post ID cannot be null");
        }
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        postRepository.delete(post);
    }
}

