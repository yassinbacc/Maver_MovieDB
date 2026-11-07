package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "acteurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Acteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @Column(nullable = false, length = 50)
    private String nationalite;

    @OneToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(length = 255)
    private String url;

    @Column(name = "tmdb_id", unique = true)
    private Integer tmdbId; 

    @OneToMany(mappedBy = "acteur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Commentaire> commentaires;

    @OneToMany(mappedBy = "acteur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<FilmActeur> filmActeurs;
}