package com.movie.gestionfilm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "filmacteurs")
@IdClass(FilmActeurId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilmActeur implements Serializable {

    @Id
    @ManyToOne
    @JoinColumn(name = "film_id", nullable = false)
    private Film film;

    @Id
    @ManyToOne
    @JoinColumn(name = "acteur_id", nullable = false)
    private Acteur acteur;
}