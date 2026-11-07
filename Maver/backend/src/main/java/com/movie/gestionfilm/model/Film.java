package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "films")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Film {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(name = "annee_sortie", nullable = false)
    private Integer anneeSortie;

    @Convert(converter = GenreConverter.class)
    @Column(nullable = false)
    private Genre genre;

    @ManyToOne
    @JoinColumn(name = "realisateur_id", nullable = false)
    private Utilisateur realisateur;

    @Column(length = 255)
    private String url;

    @OneToMany(mappedBy = "film", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Commentaire> commentaires;

    @OneToMany(mappedBy = "film", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<FilmActeur> filmActeurs;

    public enum Genre {
        Action, Drame, Comédie, Horreur, Science_Fiction
    }
}