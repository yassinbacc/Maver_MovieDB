package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.TmdbActor;
import com.movie.gestionfilm.model.TmdbMovie;
import com.movie.gestionfilm.service.TmdbService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tmdb")
@CrossOrigin(origins = "*")
public class TmdbController {

    @Autowired
    private TmdbService tmdbService;

    @GetMapping("/movies/{tmdbId}")
    public ResponseEntity<?> fetchAndStoreMovie(@PathVariable Integer tmdbId) {
        try {
            System.out.println("TMDB Controller: Received request to store movie " + tmdbId);
            TmdbMovie movie = tmdbService.fetchAndStoreMovie(tmdbId);
            System.out.println("TMDB Controller: Successfully stored movie " + tmdbId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Movie stored successfully",
                "tmdbId", movie.getTmdbId(),
                "title", movie.getTitle()
            ));
        } catch (Exception e) {
            System.err.println("TMDB Controller Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Request Failed",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/actors/{tmdbId}")
    public ResponseEntity<?> fetchAndStoreActor(@PathVariable Integer tmdbId) {
        try {
            TmdbActor actor = tmdbService.fetchAndStoreActor(tmdbId);
            return ResponseEntity.ok(actor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}