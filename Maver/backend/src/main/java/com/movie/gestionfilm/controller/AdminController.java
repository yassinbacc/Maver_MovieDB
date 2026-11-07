package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Post;
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
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private CommunityService communityService;

    @Autowired
    private com.movie.gestionfilm.service.ContactMessageService contactMessageService;

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    private boolean isAdmin(Optional<Utilisateur> userOpt) {
        return userOpt.map(user -> user.getRole() == Utilisateur.Role.admin).orElse(false);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            List<Map<String, Object>> users = utilisateurRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> userMap = new java.util.HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("nom", user.getNom());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole().name());
                    return userMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching users: " + e.getMessage());
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            Optional<Utilisateur> userOpt = utilisateurRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("nom", user.getNom());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole().name());

            return ResponseEntity.ok(userMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching user: " + e.getMessage());
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            Optional<Utilisateur> userOpt = utilisateurRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));

            if (request.containsKey("nom")) {
                user.setNom((String) request.get("nom"));
            }
            if (request.containsKey("email")) {
                String newEmail = (String) request.get("email");

                Optional<Utilisateur> existingUser = utilisateurRepository.findByEmail(newEmail);
                if (existingUser.isPresent()) {
                    Utilisateur existing = existingUser.orElseThrow();
                    if (!existing.getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already in use");
                    }
                }
                user.setEmail(newEmail);
            }
            if (request.containsKey("role")) {
                try {
                    String roleStr = ((String) request.get("role")).toLowerCase();
                    Utilisateur.Role role = Utilisateur.Role.valueOf(roleStr);
                    user.setRole(role);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid role: " + request.get("role"));
                }
            }
            if (request.containsKey("password")) {
                String password = (String) request.get("password");
                if (password != null && password.length() >= 6) {

                    user.setMotDePasse(password);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 6 characters");
                }
            }

            Utilisateur saved = utilisateurRepository.save(user);

            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", saved.getId());
            userMap.put("nom", saved.getNom());
            userMap.put("email", saved.getEmail());
            userMap.put("role", saved.getRole().name());

            return ResponseEntity.ok(userMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating user: " + e.getMessage());
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            Optional<Utilisateur> userOpt = utilisateurRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            Utilisateur userToDelete = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            Utilisateur adminUser = adminOpt.orElseThrow(() -> new RuntimeException("Admin not found"));

            if (userToDelete.getId().equals(adminUser.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Cannot delete your own account");
            }

            utilisateurRepository.delete(userToDelete);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting user: " + e.getMessage());
        }
    }

    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            List<Post> posts = communityService.getAllPosts();

            List<Map<String, Object>> postData = posts.stream()
                .map(post -> {
                    Map<String, Object> postMap = new java.util.HashMap<>();
                    postMap.put("id", post.getId());
                    postMap.put("content", post.getContent());
                    postMap.put("createdAt", post.getCreatedAt());

                    Map<String, Object> userMap = new java.util.HashMap<>();
                    userMap.put("id", post.getUser().getId());
                    userMap.put("nom", post.getUser().getNom());
                    userMap.put("email", post.getUser().getEmail());
                    postMap.put("user", userMap);

                    return postMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(postData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching posts: " + e.getMessage());
        }
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable Integer postId,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            String content = (String) request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Content is required");
            }

            Post post = communityService.updatePostAsAdmin(postId, content);

            Map<String, Object> postMap = new java.util.HashMap<>();
            postMap.put("id", post.getId());
            postMap.put("content", post.getContent());
            postMap.put("createdAt", post.getCreatedAt());

            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", post.getUser().getId());
            userMap.put("nom", post.getUser().getNom());
            userMap.put("email", post.getUser().getEmail());
            postMap.put("user", userMap);

            return ResponseEntity.ok(postMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating post: " + e.getMessage());
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable Integer postId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            communityService.deletePostAsAdmin(postId);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting post: " + e.getMessage());
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getAllMessages(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            List<com.movie.gestionfilm.model.ContactMessage> messages = contactMessageService.getAllMessages();
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching messages: " + e.getMessage());
        }
    }

    @PutMapping("/messages/{id}/read")
    public ResponseEntity<?> markMessageAsRead(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            com.movie.gestionfilm.model.ContactMessage message = contactMessageService.markAsRead(id);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error marking message as read: " + e.getMessage());
        }
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> adminOpt = getUserFromAuth(auth);
            if (!isAdmin(adminOpt)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
            }

            contactMessageService.deleteMessage(id);
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting message: " + e.getMessage());
        }
    }
}