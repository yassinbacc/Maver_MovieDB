package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    public Optional<Utilisateur> getUtilisateurById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }
        return utilisateurRepository.findById(id);
    }

    public Optional<Utilisateur> getUtilisateurByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return Optional.empty();
        }
        return utilisateurRepository.findByEmail(email);
    }

    public Utilisateur createUtilisateur(Utilisateur utilisateur) {
        if (utilisateur == null) {
            throw new IllegalArgumentException("Utilisateur cannot be null");
        }
        if (utilisateur.getEmail() == null) {
            throw new IllegalArgumentException("Email cannot be null");
        }
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new RuntimeException("Email already exists: " + utilisateur.getEmail());
        }

        return utilisateurRepository.save(utilisateur);
    }

    public Utilisateur updateUtilisateur(Integer id, Utilisateur utilisateurDetails) {
        if (id == null) {
            throw new IllegalArgumentException("Utilisateur id cannot be null");
        }
        if (utilisateurDetails == null) {
            throw new IllegalArgumentException("Utilisateur details cannot be null");
        }
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur not found with id: " + id));

        if (utilisateurDetails.getNom() != null) {
            utilisateur.setNom(utilisateurDetails.getNom());
        }
        if (utilisateurDetails.getEmail() != null && !utilisateurDetails.getEmail().equals(utilisateur.getEmail())) {
            if (utilisateurRepository.existsByEmail(utilisateurDetails.getEmail())) {
                throw new RuntimeException("Email already exists: " + utilisateurDetails.getEmail());
            }
            utilisateur.setEmail(utilisateurDetails.getEmail());
        }
        if (utilisateurDetails.getMotDePasse() != null) {
            utilisateur.setMotDePasse(utilisateurDetails.getMotDePasse());
        }
        if (utilisateurDetails.getRole() != null) {
            utilisateur.setRole(utilisateurDetails.getRole());
        }

        return utilisateurRepository.save(utilisateur);
    }

    public void deleteUtilisateur(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Utilisateur id cannot be null");
        }
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur not found with id: " + id));
        utilisateurRepository.delete(utilisateur);
    }
}