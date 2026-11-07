package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.Film;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.FilmRepository;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FilmService {

    @Autowired
    private FilmRepository filmRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public List<Film> getAllFilms() {
        return filmRepository.findAll();
    }

    public Optional<Film> getFilmById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }
        return filmRepository.findById(id);
    }

    public List<Film> getFilmsByTitre(String titre) {
        return filmRepository.findByTitreContainingIgnoreCase(titre);
    }

    public List<Film> getFilmsByGenre(Film.Genre genre) {
        return filmRepository.findByGenre(genre);
    }

    public List<Film> getFilmsByAnneeSortie(Integer anneeSortie) {
        return filmRepository.findByAnneeSortie(anneeSortie);
    }

    public Film createFilm(Film film) {
        if (film == null) {
            throw new IllegalArgumentException("Film cannot be null");
        }

        if (film.getRealisateur() != null && film.getRealisateur().getId() != null) {
            Integer realisateurId = film.getRealisateur().getId();
            Optional<Utilisateur> realisateur = utilisateurRepository.findById(realisateurId);
            Utilisateur realisateurUser = realisateur.orElseThrow(() -> 
                new RuntimeException("Realisateur with id " + realisateurId + " not found"));
            film.setRealisateur(realisateurUser);
        }
        return filmRepository.save(film);
    }

    public Film updateFilm(Integer id, Film filmDetails) {
        if (id == null) {
            throw new IllegalArgumentException("Film id cannot be null");
        }
        if (filmDetails == null) {
            throw new IllegalArgumentException("Film details cannot be null");
        }
        Film film = filmRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Film not found with id: " + id));

        if (filmDetails.getTitre() != null) {
            film.setTitre(filmDetails.getTitre());
        }
        if (filmDetails.getSynopsis() != null) {
            film.setSynopsis(filmDetails.getSynopsis());
        }
        if (filmDetails.getAnneeSortie() != null) {
            film.setAnneeSortie(filmDetails.getAnneeSortie());
        }
        if (filmDetails.getGenre() != null) {
            film.setGenre(filmDetails.getGenre());
        }
        if (filmDetails.getUrl() != null) {
            film.setUrl(filmDetails.getUrl());
        }
        if (filmDetails.getRealisateur() != null && filmDetails.getRealisateur().getId() != null) {
            Integer realisateurId = filmDetails.getRealisateur().getId();
            Utilisateur realisateur = utilisateurRepository.findById(realisateurId)
                    .orElseThrow(() -> new RuntimeException("Realisateur not found with id: " + realisateurId));
            film.setRealisateur(realisateur);
        }

        return filmRepository.save(film);
    }

    public Film partialUpdateFilm(Integer id, Film filmDetails) {
        if (id == null) {
            throw new IllegalArgumentException("Film id cannot be null");
        }
        if (filmDetails == null) {
            throw new IllegalArgumentException("Film details cannot be null");
        }
        Film film = filmRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Film not found with id: " + id));

        if (filmDetails.getTitre() != null && !filmDetails.getTitre().isEmpty()) {
            film.setTitre(filmDetails.getTitre());
        }
        if (filmDetails.getSynopsis() != null) {
            film.setSynopsis(filmDetails.getSynopsis());
        }
        if (filmDetails.getAnneeSortie() != null) {
            film.setAnneeSortie(filmDetails.getAnneeSortie());
        }
        if (filmDetails.getGenre() != null) {
            film.setGenre(filmDetails.getGenre());
        }
        if (filmDetails.getUrl() != null) {
            film.setUrl(filmDetails.getUrl());
        }
        if (filmDetails.getRealisateur() != null && filmDetails.getRealisateur().getId() != null) {
            Integer realisateurId = filmDetails.getRealisateur().getId();
            Utilisateur realisateur = utilisateurRepository.findById(realisateurId)
                    .orElseThrow(() -> new RuntimeException("Realisateur not found with id: " + realisateurId));
            film.setRealisateur(realisateur);
        }

        return filmRepository.save(film);
    }

    public void deleteFilm(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Film id cannot be null");
        }
        Film film = filmRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Film not found with id: " + id));
        filmRepository.delete(film);
    }
}