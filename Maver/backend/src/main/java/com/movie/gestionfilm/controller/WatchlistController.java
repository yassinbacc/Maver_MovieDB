package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.model.WatchlistItem;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import com.movie.gestionfilm.repository.WatchlistItemRepository;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "*")
public class WatchlistController {

    @Autowired
    private WatchlistItemRepository watchlistItemRepository;
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
        List<WatchlistItem> items = watchlistItemRepository.findByUtilisateur(userOpt.get());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{filmId}")
    public ResponseEntity<?> add(@PathVariable String filmId,
                                 @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Utilisateur user = userOpt.get();
        if (watchlistItemRepository.existsByUtilisateurAndFilmId(user, filmId)) {
            return ResponseEntity.badRequest().body("Already in watchlist");
        }
        WatchlistItem item = new WatchlistItem();
        item.setUtilisateur(user);
        item.setFilmId(filmId);
        WatchlistItem saved = watchlistItemRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{filmId}")
    public ResponseEntity<?> remove(@PathVariable String filmId,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        Optional<Utilisateur> userOpt = getUserFromAuth(auth);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Unauthorized");
        Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        Optional<WatchlistItem> itemOpt = watchlistItemRepository.findByUtilisateurAndFilmId(user, filmId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();
        WatchlistItem item = itemOpt.orElseThrow(() -> new RuntimeException("Watchlist item not found"));
        watchlistItemRepository.delete(item);
        return ResponseEntity.ok(Map.of("success", true));
    }
}