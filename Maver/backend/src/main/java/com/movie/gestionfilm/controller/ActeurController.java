package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Acteur;
import com.movie.gestionfilm.service.ActeurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/acteurs")
@CrossOrigin(origins = "*")
public class ActeurController {

	@Autowired
	private ActeurService acteurService;

	@GetMapping
	public ResponseEntity<List<Acteur>> getAllActeurs() {
		try {
			return ResponseEntity.ok(acteurService.getAllActeurs());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<Acteur> getActeurById(@PathVariable Integer id) {
		try {
			Optional<Acteur> acteur = acteurService.getActeurById(id);
			return acteur.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/by-tmdb-id/{tmdbId}")
	public ResponseEntity<?> getActeurByTmdbId(@PathVariable Integer tmdbId) {
		try {
			Optional<Acteur> acteur = acteurService.getActeurByTmdbId(tmdbId);
			return acteur.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error finding actor: " + e.getMessage());
		}
	}

	@GetMapping("/by-user-name/{userName}")
	public ResponseEntity<?> getActeurByUserName(@PathVariable String userName) {
		try {
			Optional<Acteur> acteur = acteurService.getActeurByUserName(userName);
			return acteur.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error finding actor: " + e.getMessage());
		}
	}

	@PostMapping
	public ResponseEntity<?> createActeur(@RequestBody Acteur acteur) {
		try {
			return ResponseEntity.status(HttpStatus.CREATED).body(acteurService.createActeur(acteur));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating acteur: " + e.getMessage());
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> updateActeur(@PathVariable Integer id, @RequestBody Acteur details) {
		try {
			return ResponseEntity.ok(acteurService.updateActeur(id, details));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating acteur: " + e.getMessage());
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteActeur(@PathVariable Integer id) {
		try {
			acteurService.deleteActeur(id);
			return ResponseEntity.ok("Acteur deleted successfully");
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting acteur: " + e.getMessage());
		}
	}

	@PostMapping("/{id}/sync-movies")
	public ResponseEntity<?> syncActorMovies(@PathVariable Integer id) {
		try {
			acteurService.syncActorMovies(id);
			return ResponseEntity.ok("Actor movies synced successfully");
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error syncing actor movies: " + e.getMessage());
		}
	}

	@PostMapping("/sync-by-user/{userId}")
	public ResponseEntity<?> syncActorMoviesByUserId(@PathVariable Integer userId) {
		try {
			acteurService.syncActorMoviesByUserId(userId);
			return ResponseEntity.ok("Actor movies synced successfully for user ID: " + userId);
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error syncing actor movies: " + e.getMessage());
		}
	}

	@PostMapping("/sync-by-email")
	public ResponseEntity<?> syncActorMoviesByEmail(@RequestParam String email) {
		try {
			acteurService.syncActorMoviesByEmail(email);
			return ResponseEntity.ok("Actor movies synced successfully for email: " + email);
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error syncing actor movies: " + e.getMessage());
		}
	}
}