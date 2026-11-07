package com.movie.gestionfilm.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilmActeurId implements Serializable {

    private Integer film;
    private Integer acteur;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FilmActeurId that = (FilmActeurId) o;
        return Objects.equals(film, that.film) && Objects.equals(acteur, that.acteur);
    }

    @Override
    public int hashCode() {
        return Objects.hash(film, acteur);
    }
}