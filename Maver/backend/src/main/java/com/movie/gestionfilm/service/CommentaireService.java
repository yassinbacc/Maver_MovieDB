package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.Commentaire;
import com.movie.gestionfilm.model.Film;
import com.movie.gestionfilm.model.Acteur;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.CommentaireRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CommentaireService {
    
    @Autowired
    private CommentaireRepository commentaireRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public List<Commentaire> getAllCommentaires() {
        return commentaireRepository.findAll();
    }
    
    public Optional<Commentaire> getCommentaireById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }
        return commentaireRepository.findById(id);
    }
    
    public List<Commentaire> getCommentairesByFilmId(Integer filmId) {
        return commentaireRepository.findByFilmId(filmId);
    }
    
    public List<Commentaire> getCommentairesByTmdbFilmId(Integer tmdbFilmId) {
        return commentaireRepository.findByTmdbFilmId(tmdbFilmId);
    }
    
    public List<Commentaire> getCommentairesByActeurId(Integer acteurId) {
        return commentaireRepository.findByActeurId(acteurId);
    }
    
    public List<Commentaire> getCommentairesByTmdbActeurId(Integer tmdbActeurId) {
        return commentaireRepository.findByTmdbActeurId(tmdbActeurId);
    }
    
    public List<Commentaire> getCommentairesByFanId(Integer fanId) {
        return commentaireRepository.findByFanId(fanId);
    }
    
    public Commentaire createCommentaire(Commentaire commentaire) {
        if (commentaire.getNote() < 1 || commentaire.getNote() > 5) {
            throw new RuntimeException("Note must be between 1 and 5");
        }
        if (commentaire.getFilm() != null && commentaire.getFilm().getId() != null) {
            try {
                Film existingFilm = entityManager.find(Film.class, commentaire.getFilm().getId());
                if (existingFilm != null) {
                    commentaire.setFilm(existingFilm);
                } else {
                    commentaire.setFilm(null);
                }
            } catch (Exception e) {
                commentaire.setFilm(null);
            }
        }
        if (commentaire.getActeur() != null && commentaire.getActeur().getId() != null) {
            try {
                Acteur existingActeur = entityManager.find(Acteur.class, commentaire.getActeur().getId());
                if (existingActeur != null) {
                    commentaire.setActeur(existingActeur);
                } else {
                    commentaire.setActeur(null);
                }
            } catch (Exception e) {
                commentaire.setActeur(null);
            }
        }
        
        if (commentaire.getTmdbActeurId() != null) {
            commentaire.setActeur(null);
        }
        if (commentaire.getFan() == null || commentaire.getFan().getId() == null) {
            throw new IllegalArgumentException("fan.id is required");
        } else {
            Utilisateur refFan = entityManager.getReference(Utilisateur.class, commentaire.getFan().getId());
            commentaire.setFan(refFan);
        }
        return commentaireRepository.save(commentaire);
    }
    
    public Commentaire updateCommentaire(Integer id, Commentaire commentaireDetails) {
        if (id == null) {
            throw new IllegalArgumentException("Commentaire id cannot be null");
        }
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire not found with id: " + id));
        
        if (commentaireDetails != null) {
            if (commentaireDetails.getNote() != null) {
                if (commentaireDetails.getNote() < 1 || commentaireDetails.getNote() > 5) {
                    throw new RuntimeException("Note must be between 1 and 5");
                }
                commentaire.setNote(commentaireDetails.getNote());
            }
            if (commentaireDetails.getCommentaire() != null) {
                commentaire.setCommentaire(commentaireDetails.getCommentaire());
            }
        }
        
        return commentaireRepository.save(commentaire);
    }
    
    public void deleteCommentaire(Integer id, Integer userId) {
        if (id == null) {
            throw new IllegalArgumentException("Commentaire id cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User id cannot be null");
        }
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire not found with id: " + id));
        
        if (commentaire.getFan() == null || commentaire.getFan().getId() == null || !commentaire.getFan().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }
        
        commentaireRepository.delete(commentaire);
    }
}
