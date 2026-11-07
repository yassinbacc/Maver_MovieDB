package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.Acteur;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.ActeurRepository;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ActeurService {

	@Autowired
	private ActeurRepository acteurRepository;

	@Autowired
	private UtilisateurRepository utilisateurRepository;

	@Autowired
	private TmdbService tmdbService;

	public List<Acteur> getAllActeurs() {
		return acteurRepository.findAll();
	}

	public Optional<Acteur> getActeurById(Integer id) {
		if (id == null) {
			return Optional.empty();
		}
		return acteurRepository.findById(id);
	}

	public Optional<Acteur> getActeurByTmdbId(Integer tmdbId) {
		if (tmdbId == null) {
			return Optional.empty();
		}
		return acteurRepository.findByTmdbId(tmdbId);
	}

	public Optional<Acteur> getActeurByUserName(String userName) {
		if (userName == null || userName.trim().isEmpty()) {
			return Optional.empty();
		}
		Optional<Utilisateur> userOpt = utilisateurRepository.findByNomIgnoreCase(userName);
		return userOpt.flatMap(acteurRepository::findByUtilisateur);
	}

	public Acteur createActeur(Acteur acteur) {
		if (acteur == null) {
			throw new IllegalArgumentException("Acteur cannot be null");
		}
		if (acteur.getUtilisateur() == null || acteur.getUtilisateur().getId() == null) {
			throw new IllegalArgumentException("utilisateur.id is required for acteur");
		}
		Integer userId = acteur.getUtilisateur().getId();
		Utilisateur utilisateur = utilisateurRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("Utilisateur not found with id: " + userId));
		acteur.setUtilisateur(utilisateur);
		Acteur savedActeur = acteurRepository.save(acteur);

		if (savedActeur.getTmdbId() != null) {
			try {
				System.out.println("Auto-fetching TMDB data for actor with tmdb_id: " + savedActeur.getTmdbId());

				tmdbService.fetchAndStoreActor(savedActeur.getTmdbId());

				tmdbService.fetchAndStoreActorFilmography(savedActeur.getTmdbId());
				System.out.println("Successfully auto-fetched TMDB data and movies for actor: " + utilisateur.getNom());
			} catch (Exception e) {
				System.err.println("Error auto-fetching TMDB data for actor: " + e.getMessage());
				e.printStackTrace();

			}
		}

		return savedActeur;
	}

	public Acteur updateActeur(Integer id, Acteur details) {
		if (id == null) {
			throw new IllegalArgumentException("Acteur id cannot be null");
		}
		if (details == null) {
			throw new IllegalArgumentException("Acteur details cannot be null");
		}
		Acteur acteur = acteurRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Acteur not found with id: " + id));

		Integer oldTmdbId = acteur.getTmdbId();

		if (details.getDateNaissance() != null) {
			acteur.setDateNaissance(details.getDateNaissance());
		}
		if (details.getNationalite() != null) {
			acteur.setNationalite(details.getNationalite());
		}
		if (details.getUrl() != null) {
			acteur.setUrl(details.getUrl());
		}
		if (details.getTmdbId() != null) {
			acteur.setTmdbId(details.getTmdbId());
		}
		if (details.getUtilisateur() != null && details.getUtilisateur().getId() != null) {
			Integer userId = details.getUtilisateur().getId();
			Utilisateur utilisateur = utilisateurRepository.findById(userId)
					.orElseThrow(() -> new RuntimeException("Utilisateur not found with id: " + userId));
			acteur.setUtilisateur(utilisateur);
		}
		Acteur savedActeur = acteurRepository.save(acteur);

		Integer newTmdbId = savedActeur.getTmdbId();
		if (newTmdbId != null && !newTmdbId.equals(oldTmdbId)) {
			try {
				System.out.println("Auto-fetching TMDB data for updated actor with tmdb_id: " + newTmdbId);

				tmdbService.fetchAndStoreActor(newTmdbId);

				tmdbService.fetchAndStoreActorFilmography(newTmdbId);
				System.out.println("Successfully auto-fetched TMDB data and movies for updated actor: " + savedActeur.getUtilisateur().getNom());
			} catch (Exception e) {
				System.err.println("Error auto-fetching TMDB data for updated actor: " + e.getMessage());
				e.printStackTrace();

			}
		}

		return savedActeur;
	}

	public void deleteActeur(Integer id) {
		if (id == null) {
			throw new IllegalArgumentException("Acteur id cannot be null");
		}
		Acteur acteur = acteurRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Acteur not found with id: " + id));
		acteurRepository.delete(acteur);
	}

	public void syncActorMovies(Integer acteurId) {
		if (acteurId == null) {
			throw new IllegalArgumentException("Acteur id cannot be null");
		}
		Acteur acteur = acteurRepository.findById(acteurId)
				.orElseThrow(() -> new RuntimeException("Acteur not found with id: " + acteurId));

		if (acteur.getTmdbId() == null) {
			throw new RuntimeException("Actor does not have a TMDB ID. Please set tmdb_id first.");
		}

		if (acteur.getUtilisateur() == null || acteur.getUtilisateur().getNom() == null) {
			throw new RuntimeException("Actor user information is missing");
		}

		try {
			System.out.println("Manually syncing movies for actor: " + acteur.getUtilisateur().getNom() + " (TMDB ID: " + acteur.getTmdbId() + ")");

			tmdbService.fetchAndStoreActor(acteur.getTmdbId());

			tmdbService.fetchAndStoreActorFilmography(acteur.getTmdbId());
			System.out.println("Successfully synced movies for actor: " + acteur.getUtilisateur().getNom());
		} catch (Exception e) {
			System.err.println("Error syncing actor movies: " + e.getMessage());
			e.printStackTrace();
			throw new RuntimeException("Error syncing actor movies: " + e.getMessage(), e);
		}
	}

	public void syncActorMoviesByUserId(Integer userId) {
		if (userId == null) {
			throw new IllegalArgumentException("User id cannot be null");
		}
		Optional<Acteur> acteurOpt = acteurRepository.findByUtilisateurId(userId);
		Acteur acteur = acteurOpt.orElseThrow(() -> new RuntimeException("No actor found for user ID: " + userId));
		if (acteur.getId() == null) {
			throw new RuntimeException("Actor ID is null");
		}
		syncActorMovies(acteur.getId());
	}

	public void syncActorMoviesByEmail(String email) {
		if (email == null || email.trim().isEmpty()) {
			throw new IllegalArgumentException("Email cannot be null or empty");
		}
		Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(email);
		Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found with email: " + email));
		Optional<Acteur> acteurOpt = acteurRepository.findByUtilisateur(user);
		Acteur acteur = acteurOpt.orElseThrow(() -> new RuntimeException("No actor found for user with email: " + email));
		if (acteur.getId() == null) {
			throw new RuntimeException("Actor ID is null");
		}
		syncActorMovies(acteur.getId());
	}
}