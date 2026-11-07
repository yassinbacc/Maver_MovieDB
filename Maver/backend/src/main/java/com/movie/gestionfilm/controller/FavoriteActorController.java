package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.FavoriteActor;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.FavoriteActorRepository;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/favorites/actors")
@CrossOrigin(origins = "*")
public class FavoriteActorController {

    @Autowired
    private FavoriteActorRepository favoriteActorRepository;
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

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        List<FavoriteActor> items = favoriteActorRepository.findByUtilisateur(user);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{actorId}")
    public ResponseEntity<?> add(@PathVariable String actorId,
                                 @RequestParam String actorName,
                                 @RequestParam(required = false) String profileImageUrl,
                                 @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        if (favoriteActorRepository.existsByUtilisateurAndActorId(user, actorId)) {
            return ResponseEntity.badRequest().body("Already in favorites");
        }
        FavoriteActor fa = new FavoriteActor();
        fa.setUtilisateur(user);
        fa.setActorId(actorId);
        fa.setActorName(actorName);
        if (profileImageUrl != null && !profileImageUrl.trim().isEmpty()) {
            fa.setProfileImageUrl(profileImageUrl.trim());
        }
        FavoriteActor saved = favoriteActorRepository.save(fa);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{actorId}")
    public ResponseEntity<?> remove(@PathVariable String actorId,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        Optional<FavoriteActor> faOpt = favoriteActorRepository.findByUtilisateurAndActorId(user, actorId);
        if (faOpt.isEmpty()) return ResponseEntity.notFound().build();
        FavoriteActor fa = faOpt.orElseThrow(() -> new RuntimeException("Favorite actor not found"));
        favoriteActorRepository.delete(fa);
        return ResponseEntity.ok(Map.of("success", true));
    }
}