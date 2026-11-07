package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Film;
import com.movie.gestionfilm.service.FilmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/films")
@CrossOrigin(origins = "*")
public class FilmController {

    @Autowired
    private FilmService filmService;

    @GetMapping
    public ResponseEntity<List<Film>> getAllFilms() {
        try {
            List<Film> films = filmService.getAllFilms();
            return ResponseEntity.ok(films);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Film> getFilmById(@PathVariable Integer id) {
        try {
            Optional<Film> film = filmService.getFilmById(id);
            return film.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Film>> searchFilmsByTitre(@RequestParam String titre) {
        try {
            List<Film> films = filmService.getFilmsByTitre(titre);
            return ResponseEntity.ok(films);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/genre/{genre}")
    public ResponseEntity<List<Film>> getFilmsByGenre(@PathVariable Film.Genre genre) {
        try {
            List<Film> films = filmService.getFilmsByGenre(genre);
            return ResponseEntity.ok(films);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/year/{anneeSortie}")
    public ResponseEntity<List<Film>> getFilmsByAnneeSortie(@PathVariable Integer anneeSortie) {
        try {
            List<Film> films = filmService.getFilmsByAnneeSortie(anneeSortie);
            return ResponseEntity.ok(films);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createFilm(@RequestBody Film film) {
        try {
            Film createdFilm = filmService.createFilm(film);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating film: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFilm(@PathVariable Integer id, @RequestBody Film filmDetails) {
        try {
            Film updatedFilm = filmService.updateFilm(id, filmDetails);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> partialUpdateFilm(@PathVariable Integer id, @RequestBody Film filmDetails) {
        try {
            Film updatedFilm = filmService.partialUpdateFilm(id, filmDetails);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/titre")
    public ResponseEntity<?> updateFilmTitre(@PathVariable Integer id, @RequestBody String titre) {
        try {
            Film film = new Film();
            film.setTitre(titre);
            Film updatedFilm = filmService.partialUpdateFilm(id, film);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film title: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/synopsis")
    public ResponseEntity<?> updateFilmSynopsis(@PathVariable Integer id, @RequestBody String synopsis) {
        try {
            Film film = new Film();
            film.setSynopsis(synopsis);
            Film updatedFilm = filmService.partialUpdateFilm(id, film);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film synopsis: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/annee-sortie")
    public ResponseEntity<?> updateFilmAnneeSortie(@PathVariable Integer id, @RequestBody Integer anneeSortie) {
        try {
            Film film = new Film();
            film.setAnneeSortie(anneeSortie);
            Film updatedFilm = filmService.partialUpdateFilm(id, film);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film release year: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/genre")
    public ResponseEntity<?> updateFilmGenre(@PathVariable Integer id, @RequestBody Film.Genre genre) {
        try {
            Film film = new Film();
            film.setGenre(genre);
            Film updatedFilm = filmService.partialUpdateFilm(id, film);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film genre: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/url")
    public ResponseEntity<?> updateFilmUrl(@PathVariable Integer id, @RequestBody String url) {
        try {
            Film film = new Film();
            film.setUrl(url);
            Film updatedFilm = filmService.partialUpdateFilm(id, film);
            return ResponseEntity.ok(updatedFilm);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating film URL: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFilm(@PathVariable Integer id) {
        try {
            filmService.deleteFilm(id);
            return ResponseEntity.ok().body("Film deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting film: " + e.getMessage());
        }
    }
}