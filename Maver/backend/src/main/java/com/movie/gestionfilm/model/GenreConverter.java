package com.movie.gestionfilm.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class GenreConverter implements AttributeConverter<Film.Genre, String> {

	@Override
	public String convertToDatabaseColumn(Film.Genre attribute) {
		if (attribute == null) return null;

		return switch (attribute) {
			case Action -> "Action";
			case Drame -> "Drame";
			case Comédie -> "Comédie";
			case Horreur -> "Horreur";
			case Science_Fiction -> "Science-Fiction";
		};
	}

	@Override
	public Film.Genre convertToEntityAttribute(String dbData) {
		if (dbData == null) return null;

		return switch (dbData) {
			case "Action" -> Film.Genre.Action;
			case "Drame" -> Film.Genre.Drame;
			case "Comédie" -> Film.Genre.Comédie;
			case "Horreur" -> Film.Genre.Horreur;
			case "Science-Fiction" -> Film.Genre.Science_Fiction;

			case "Science_Fiction" -> Film.Genre.Science_Fiction;
			default -> throw new IllegalArgumentException("Unknown genre value: " + dbData);
		};
	}
}