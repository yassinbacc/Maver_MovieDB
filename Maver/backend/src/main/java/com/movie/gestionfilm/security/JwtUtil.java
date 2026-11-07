package com.movie.gestionfilm.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Optional;

public class JwtUtil {

    private static final String SECRET = System.getenv().getOrDefault("JWT_SECRET", "maver-demo-secret-key-change-me-please-0123456789");
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public static Key getKey() {
        return KEY;
    }

    public static Optional<Claims> parse(String token) {
        try {
            return Optional.of(Jwts.parserBuilder().setSigningKey(KEY).build().parseClaimsJws(token).getBody());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}