package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    @OneToOne(mappedBy = "utilisateur", cascade = CascadeType.ALL)
    @JsonIgnore
    private Acteur acteur;

    @OneToMany(mappedBy = "realisateur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Film> filmsRealises;

    @OneToMany(mappedBy = "fan", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Commentaire> commentaires;

    public enum Role {
        realisateur, acteur, fan, admin
    }
}