package com.movie.gestionfilm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.movie.gestionfilm.model.*;
import com.movie.gestionfilm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class TmdbService {

    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";

    @Value("${tmdb.api.key:b2524dcdf8e11a2cb256f322b5cef254}")
    private String tmdbApiKey;

    @Autowired
    private TmdbMovieRepository movieRepository;

    @Autowired
    private TmdbActorRepository actorRepository;

    @Autowired
    private TmdbGenreRepository genreRepository;

    @Autowired
    private TmdbMovieGenreRepository movieGenreRepository;

    @Autowired
    private TmdbMovieActorRepository movieActorRepository;

    @Autowired
    private TmdbMovieCrewRepository movieCrewRepository;

    @Autowired
    private TmdbMovieVideoRepository movieVideoRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public TmdbMovie fetchAndStoreMovie(Integer tmdbId) {
        try {
            System.out.println("Fetching movie with TMDB ID: " + tmdbId);

            Optional<TmdbMovie> existing = movieRepository.findByTmdbId(tmdbId);
            if (existing.isPresent()) {
                System.out.println("Movie " + tmdbId + " already exists in database");
                return existing.get();
            }

            String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/movie/" + tmdbId)
                .queryParam("api_key", tmdbApiKey)
                .queryParam("append_to_response", "credits,videos")
                .toUriString();

            System.out.println("Fetching from TMDB: " + url);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().isError() || response.getBody() == null) {
                throw new RuntimeException("Failed to fetch movie from TMDB: " + response.getStatusCode());
            }

            JsonNode movieData = objectMapper.readTree(response.getBody());

            if (movieData.has("success") && movieData.get("success").asBoolean() == false) {
                throw new RuntimeException("TMDB API error: " + movieData.get("status_message").asText());
            }

            System.out.println("Creating movie entity for: " + movieData.get("title").asText());
            TmdbMovie movie = createMovieFromJson(movieData);
            movie = movieRepository.save(movie);
            System.out.println("Movie saved with ID: " + movie.getId() + ", TMDB ID: " + movie.getTmdbId());

            if (movieData.has("genres")) {
                System.out.println("Storing genres...");
                storeMovieGenres(movie, movieData.get("genres"));
            }

            if (movieData.has("credits") && movieData.get("credits").has("cast")) {
                System.out.println("Storing cast...");
                storeMovieActors(movie, movieData.get("credits").get("cast"));
            }

            if (movieData.has("credits") && movieData.get("credits").has("crew")) {
                System.out.println("Storing crew...");
                storeMovieCrew(movie, movieData.get("credits").get("crew"));
            }

            if (movieData.has("videos") && movieData.get("videos").has("results")) {
                System.out.println("Storing videos...");
                storeMovieVideos(movie, movieData.get("videos").get("results"));
            }

            updateDirectorAndWriter(movie, movieData);

            movie.setTmdbData(response.getBody());
            movie = movieRepository.save(movie);

            System.out.println("Successfully stored movie: " + movie.getTitle());
            return movie;
        } catch (Exception e) {
            System.err.println("Error fetching and storing movie: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error fetching and storing movie: " + e.getMessage(), e);
        }
    }

    @Transactional
    public TmdbActor fetchAndStoreActor(Integer tmdbId) {
        try {

            Optional<TmdbActor> existing = actorRepository.findByTmdbId(tmdbId);
            if (existing.isPresent()) {
                return existing.get();
            }

            String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/person/" + tmdbId)
                .queryParam("api_key", tmdbApiKey)
                .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode actorData = objectMapper.readTree(response.getBody());

            TmdbActor actor = createActorFromJson(actorData);
            actor.setTmdbData(response.getBody());
            actor = actorRepository.save(actor);

            return actor;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching and storing actor: " + e.getMessage(), e);
        }
    }

    public Integer searchActorByName(String actorName) {
        try {
            System.out.println("Searching TMDB for actor: " + actorName);
            String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/search/person")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("query", actorName)
                .queryParam("include_adult", "false")
                .queryParam("page", "1")
                .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode searchData = objectMapper.readTree(response.getBody());

            if (searchData.has("results") && searchData.get("results").isArray()) {
                JsonNode results = searchData.get("results");
                if (results.size() > 0) {
                    JsonNode firstResult = results.get(0);
                    Integer tmdbId = firstResult.get("id").asInt();
                    String foundName = firstResult.has("name") ? firstResult.get("name").asText() : "";
                    System.out.println("Found actor in TMDB: " + foundName + " (TMDB ID: " + tmdbId + ")");
                    return tmdbId;
                }
            }

            System.out.println("No actor found in TMDB for name: " + actorName);
            return null;
        } catch (Exception e) {
            System.err.println("Error searching TMDB for actor: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Transactional
    public void fetchAndStoreActorFilmography(Integer tmdbActorId) {
        try {
            System.out.println("Fetching filmography for actor with TMDB ID: " + tmdbActorId);

            String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/person/" + tmdbActorId)
                .queryParam("api_key", tmdbApiKey)
                .queryParam("append_to_response", "combined_credits")
                .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode actorData = objectMapper.readTree(response.getBody());

            JsonNode castNode = actorData.get("combined_credits");
            if (castNode != null && castNode.has("cast")) {
                JsonNode castArray = castNode.get("cast");
                int movieCount = 0;
                int storedCount = 0;

                for (JsonNode movieNode : castArray) {
                    try {

                        String mediaType = movieNode.has("media_type") ? movieNode.get("media_type").asText() : "movie";
                        if (!"movie".equals(mediaType)) {
                            continue; 
                        }

                        Integer movieTmdbId = movieNode.has("id") ? movieNode.get("id").asInt() : null;
                        if (movieTmdbId == null) {
                            continue; 
                        }

                        movieCount++;

                        String posterPath = movieNode.has("poster_path") && !movieNode.get("poster_path").isNull()
                            ? movieNode.get("poster_path").asText() : null;
                        String title = movieNode.has("title") ? movieNode.get("title").asText() : null;
                        String releaseDate = movieNode.has("release_date") && !movieNode.get("release_date").isNull()
                            ? movieNode.get("release_date").asText() : null;

                        if (posterPath == null || title == null || releaseDate == null) {
                            System.out.println("Skipping movie (missing basic info): " + title + " (TMDB ID: " + movieTmdbId + ")");
                            continue;
                        }

                        try {
                            fetchAndStoreMovie(movieTmdbId);
                            storedCount++;
                            System.out.println("Stored movie: " + title + " (TMDB ID: " + movieTmdbId + ")");
                        } catch (Exception movieError) {
                            System.err.println("Error storing movie " + movieTmdbId + ": " + movieError.getMessage());

                        }
                    } catch (Exception e) {
                        System.err.println("Error processing movie from actor filmography: " + e.getMessage());
                    }
                }

                System.out.println("Filmography fetch complete. Found " + movieCount + " movies, stored " + storedCount + " movies for actor " + tmdbActorId);
            }
        } catch (Exception e) {
            System.err.println("Error fetching actor filmography: " + e.getMessage());
            e.printStackTrace();

        }
    }

    private TmdbMovie createMovieFromJson(JsonNode data) {
        TmdbMovie movie = new TmdbMovie();
        movie.setTmdbId(data.get("id").asInt());
        movie.setTitle(data.has("title") ? data.get("title").asText() : "");
        movie.setOriginalTitle(data.has("original_title") ? data.get("original_title").asText() : null);
        movie.setOverview(data.has("overview") ? data.get("overview").asText() : null);

        if (data.has("release_date") && !data.get("release_date").asText().isEmpty()) {
            try {
                movie.setReleaseDate(LocalDate.parse(data.get("release_date").asText()));
            } catch (Exception e) {

            }
        }

        movie.setRuntime(data.has("runtime") && !data.get("runtime").isNull() ? data.get("runtime").asInt() : null);
        movie.setVoteAverage(data.has("vote_average") && !data.get("vote_average").isNull() 
            ? BigDecimal.valueOf(data.get("vote_average").asDouble()) : null);
        movie.setVoteCount(data.has("vote_count") ? data.get("vote_count").asInt() : 0);
        movie.setPopularity(data.has("popularity") && !data.get("popularity").isNull()
            ? BigDecimal.valueOf(data.get("popularity").asDouble()) : null);
        movie.setPosterPath(data.has("poster_path") && !data.get("poster_path").isNull() 
            ? data.get("poster_path").asText() : null);
        movie.setBackdropPath(data.has("backdrop_path") && !data.get("backdrop_path").isNull()
            ? data.get("backdrop_path").asText() : null);
        movie.setStatus(data.has("status") ? data.get("status").asText() : null);
        movie.setTagline(data.has("tagline") ? data.get("tagline").asText() : null);
        movie.setImdbId(data.has("imdb_id") && !data.get("imdb_id").isNull() ? data.get("imdb_id").asText() : null);
        movie.setHomepage(data.has("homepage") && !data.get("homepage").isNull() ? data.get("homepage").asText() : null);
        movie.setOriginalLanguage(data.has("original_language") ? data.get("original_language").asText() : null);
        movie.setBudget(data.has("budget") && !data.get("budget").isNull() ? data.get("budget").asLong() : null);
        movie.setRevenue(data.has("revenue") && !data.get("revenue").isNull() ? data.get("revenue").asLong() : null);

        if (data.has("production_companies")) {
            movie.setProductionCompanies(data.get("production_companies").toString());
        }
        if (data.has("production_countries")) {
            movie.setProductionCountries(data.get("production_countries").toString());
        }
        if (data.has("spoken_languages")) {
            movie.setSpokenLanguages(data.get("spoken_languages").toString());
        }

        return movie;
    }

    private TmdbActor createActorFromJson(JsonNode data) {
        TmdbActor actor = new TmdbActor();
        actor.setTmdbId(data.get("id").asInt());
        actor.setName(data.has("name") ? data.get("name").asText() : "");
        actor.setProfilePath(data.has("profile_path") && !data.get("profile_path").isNull()
            ? data.get("profile_path").asText() : null);
        actor.setBiography(data.has("biography") ? data.get("biography").asText() : null);

        if (data.has("birthday") && !data.get("birthday").asText().isEmpty()) {
            try {
                actor.setBirthday(LocalDate.parse(data.get("birthday").asText()));
            } catch (Exception e) {

            }
        }

        if (data.has("deathday") && !data.get("deathday").isNull() && !data.get("deathday").asText().isEmpty()) {
            try {
                actor.setDeathday(LocalDate.parse(data.get("deathday").asText()));
            } catch (Exception e) {

            }
        }

        actor.setPlaceOfBirth(data.has("place_of_birth") ? data.get("place_of_birth").asText() : null);
        actor.setKnownForDepartment(data.has("known_for_department") ? data.get("known_for_department").asText() : null);
        actor.setPopularity(data.has("popularity") && !data.get("popularity").isNull()
            ? BigDecimal.valueOf(data.get("popularity").asDouble()) : null);
        actor.setGender(data.has("gender") && !data.get("gender").isNull() ? data.get("gender").asInt() : null);
        actor.setImdbId(data.has("imdb_id") && !data.get("imdb_id").isNull() ? data.get("imdb_id").asText() : null);
        actor.setHomepage(data.has("homepage") && !data.get("homepage").isNull() ? data.get("homepage").asText() : null);

        if (data.has("also_known_as")) {
            actor.setAlsoKnownAs(data.get("also_known_as").toString());
        }

        return actor;
    }

    private void storeMovieGenres(TmdbMovie movie, JsonNode genresNode) {
        for (JsonNode genreNode : genresNode) {
            Integer genreTmdbId = genreNode.get("id").asInt();
            String genreName = genreNode.get("name").asText();

            TmdbGenre genre = null;
            int retries = 3;
            while (retries > 0 && genre == null) {
                try {
                    genre = genreRepository.findByTmdbId(genreTmdbId)
                        .orElseGet(() -> {
                            TmdbGenre newGenre = new TmdbGenre();
                            newGenre.setTmdbId(genreTmdbId);
                            newGenre.setName(genreName);
                            return genreRepository.save(newGenre);
                        });
                    break;
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("Deadlock")) {
                        retries--;
                        if (retries > 0) {
                            try {
                                Thread.sleep(100); 
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                            continue;
                        }
                    }
                    System.err.println("Error storing genre: " + e.getMessage());
                    break;
                }
            }

            if (genre == null) {
                continue; 
            }

            boolean exists = movieGenreRepository.findAll().stream()
                .anyMatch(mg -> {
                    try {
                        return mg.getMovie().getTmdbId().equals(movie.getTmdbId()) 
                            && mg.getGenre().getTmdbId().equals(genreTmdbId);
                    } catch (Exception e) {
                        return false;
                    }
                });

            if (!exists) {
                try {
                    TmdbMovieGenre movieGenre = new TmdbMovieGenre();
                    movieGenre.setMovie(movie);
                    movieGenre.setGenre(genre);
                    movieGenreRepository.save(movieGenre);
                } catch (Exception e) {
                    System.err.println("Error saving movie-genre relationship: " + e.getMessage());
                }
            }
        }
    }

    private void storeMovieActors(TmdbMovie movie, JsonNode castNode) {
        int order = 0;
        for (JsonNode actorNode : castNode) {
            Integer actorTmdbId = actorNode.get("id").asInt();

            TmdbActor actor = actorRepository.findByTmdbId(actorTmdbId)
                .orElseGet(() -> {
                    try {
                        return fetchAndStoreActor(actorTmdbId);
                    } catch (Exception e) {

                        TmdbActor newActor = new TmdbActor();
                        newActor.setTmdbId(actorTmdbId);
                        newActor.setName(actorNode.has("name") ? actorNode.get("name").asText() : "Unknown");
                        newActor.setProfilePath(actorNode.has("profile_path") && !actorNode.get("profile_path").isNull()
                            ? actorNode.get("profile_path").asText() : null);
                        return actorRepository.save(newActor);
                    }
                });

            String creditId = actorNode.has("credit_id") ? actorNode.get("credit_id").asText() : null;
            boolean exists = movieActorRepository.findAll().stream()
                .anyMatch(ma -> {
                    try {
                        return ma.getMovie().getTmdbId().equals(movie.getTmdbId())
                            && ma.getActor().getTmdbId().equals(actorTmdbId)
                            && (creditId == null || creditId.equals(ma.getCreditId()));
                    } catch (Exception e) {
                        return false;
                    }
                });

            if (!exists) {
                TmdbMovieActor movieActor = new TmdbMovieActor();
                movieActor.setMovie(movie);
                movieActor.setActor(actor);
                movieActor.setCharacter(actorNode.has("character") ? actorNode.get("character").asText() : null);
                movieActor.setCastOrder(order++);
                movieActor.setCastId(actorNode.has("cast_id") && !actorNode.get("cast_id").isNull() 
                    ? actorNode.get("cast_id").asInt() : null);
                movieActor.setCreditId(creditId);
                movieActor.setOrder(actorNode.has("order") && !actorNode.get("order").isNull()
                    ? actorNode.get("order").asInt() : null);
                movieActorRepository.save(movieActor);
            }
        }
    }

    private void storeMovieCrew(TmdbMovie movie, JsonNode crewNode) {
        for (JsonNode crewMemberNode : crewNode) {
            Integer personTmdbId = crewMemberNode.get("id").asInt();
            String job = crewMemberNode.has("job") ? crewMemberNode.get("job").asText() : "";
            String department = crewMemberNode.has("department") ? crewMemberNode.get("department").asText() : null;
            String creditId = crewMemberNode.has("credit_id") ? crewMemberNode.get("credit_id").asText() : null;

            boolean exists = movieCrewRepository.findAll().stream()
                .anyMatch(mc -> {
                    try {
                        return mc.getMovie().getTmdbId().equals(movie.getTmdbId())
                            && mc.getPersonTmdbId().equals(personTmdbId)
                            && mc.getJob().equals(job)
                            && (creditId == null || creditId.equals(mc.getCreditId()));
                    } catch (Exception e) {
                        return false;
                    }
                });

            if (!exists) {
                TmdbMovieCrew crew = new TmdbMovieCrew();
                crew.setMovie(movie);
                crew.setPersonTmdbId(personTmdbId);
                crew.setJob(job);
                crew.setDepartment(department);
                crew.setCreditId(creditId);
                movieCrewRepository.save(crew);
            }
        }
    }

    private void storeMovieVideos(TmdbMovie movie, JsonNode videosNode) {
        for (JsonNode videoNode : videosNode) {
            String videoId = videoNode.has("id") ? videoNode.get("id").asText() : null;
            if (videoId == null) continue;

            boolean exists = movieVideoRepository.findAll().stream()
                .anyMatch(mv -> {
                    try {
                        return mv.getMovie().getTmdbId().equals(movie.getTmdbId())
                            && videoId.equals(mv.getVideoId());
                    } catch (Exception e) {
                        return false;
                    }
                });

            if (!exists) {
                TmdbMovieVideo video = new TmdbMovieVideo();
                video.setMovie(movie);
                video.setVideoId(videoId);
                video.setKey(videoNode.has("key") ? videoNode.get("key").asText() : null);
                video.setName(videoNode.has("name") ? videoNode.get("name").asText() : null);
                video.setSite(videoNode.has("site") ? videoNode.get("site").asText() : null);
                video.setSize(videoNode.has("size") && !videoNode.get("size").isNull() 
                    ? videoNode.get("size").asInt() : null);
                video.setType(videoNode.has("type") ? videoNode.get("type").asText() : null);
                video.setOfficial(videoNode.has("official") && videoNode.get("official").asBoolean());

                if (videoNode.has("published_at") && !videoNode.get("published_at").isNull()) {
                    try {
                        video.setPublishedAt(LocalDateTime.parse(videoNode.get("published_at").asText(),
                            DateTimeFormatter.ISO_DATE_TIME));
                    } catch (Exception e) {

                    }
                }

                movieVideoRepository.save(video);

                if (video.getType() != null && video.getType().equals("Trailer") 
                    && video.getSite() != null && video.getSite().equals("YouTube")
                    && movie.getTrailerKey() == null) {
                    movie.setTrailerKey(video.getKey());
                    movieRepository.save(movie);
                }
            }
        }
    }

    private void updateDirectorAndWriter(TmdbMovie movie, JsonNode movieData) {
        if (movieData.has("credits") && movieData.get("credits").has("crew")) {
            JsonNode crew = movieData.get("credits").get("crew");
            String director = null;
            String writer = null;

            for (JsonNode crewMember : crew) {
                String job = crewMember.has("job") ? crewMember.get("job").asText() : "";
                String name = crewMember.has("name") ? crewMember.get("name").asText() : "";

                if (job.equals("Director") && director == null) {
                    director = name;
                }
                if ((job.equals("Writer") || job.equals("Screenplay")) && writer == null) {
                    writer = name;
                }
            }

            if (director != null) movie.setDirector(director);
            if (writer != null) movie.setWriter(writer);
        }
    }
}