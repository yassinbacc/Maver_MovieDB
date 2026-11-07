package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import io.jsonwebtoken.Jwts;
import com.movie.gestionfilm.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private final Map<String, PasswordResetInfo> resetTokens = new ConcurrentHashMap<>();

    private static class PasswordResetInfo {
        String email;
        long expiryTime;

        PasswordResetInfo(String email) {
            this.email = email;
            this.expiryTime = System.currentTimeMillis() + (60 * 60 * 1000); 
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            if (request.password == null || request.password.length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 6 characters.");
            }
            if (utilisateurRepository.existsByEmail(request.email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already in use.");
            }
            Utilisateur user = new Utilisateur();
            user.setNom(request.nom);
            user.setEmail(request.email);

            user.setMotDePasse(request.password);
            user.setRole(request.role != null ? request.role : Utilisateur.Role.fan);
            Utilisateur saved = utilisateurRepository.save(user);

            String token = generateToken(saved);
            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", saved.getId());
            userMap.put("nom", saved.getNom());
            userMap.put("email", saved.getEmail());
            userMap.put("role", saved.getRole().name().toLowerCase());
            if (saved.getProfilePicture() != null) {
                userMap.put("profilePicture", saved.getProfilePicture());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "token", token,
                    "user", userMap
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Signup failed.");
        }
    }

    @GetMapping("/check-admin")
    public ResponseEntity<?> checkAdmin() {
        try {
            Optional<Utilisateur> adminOpt = utilisateurRepository.findByEmail("admin@mail.tn");
            if (adminOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "exists", false,
                    "message", "Admin user does not exist. Please restart the backend server."
                ));
            }
            Utilisateur admin = adminOpt.orElseThrow(() -> new RuntimeException("Admin not found"));
            return ResponseEntity.ok(Map.of(
                "exists", true,
                "id", admin.getId(),
                "email", admin.getEmail(),
                "nom", admin.getNom(),
                "role", admin.getRole() != null ? admin.getRole().name() : "null",
                "passwordLength", admin.getMotDePasse() != null ? admin.getMotDePasse().length() : 0,
                "passwordPreview", admin.getMotDePasse() != null && admin.getMotDePasse().length() <= 20 
                    ? admin.getMotDePasse() 
                    : (admin.getMotDePasse() != null ? admin.getMotDePasse().substring(0, 20) + "..." : "null")
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/fix-admin")
    public ResponseEntity<?> fixAdmin() {
        try {
            System.out.println("=== FIX ADMIN ENDPOINT CALLED ===");

            Optional<Utilisateur> existing = utilisateurRepository.findByEmail("admin@mail.tn");
            existing.ifPresent(utilisateur -> {
                System.out.println("Deleting existing admin user...");
                utilisateurRepository.delete(utilisateur);
                System.out.println("✓ Deleted existing admin user");
            });
            if (existing.isEmpty()) {
                System.out.println("No existing admin user found");
            }

            System.out.println("Creating new admin user...");
            Utilisateur admin = new Utilisateur();
            admin.setNom("Admin");
            admin.setEmail("admin@mail.tn");
            admin.setMotDePasse("admin"); 
            admin.setRole(Utilisateur.Role.admin);

            System.out.println("Admin object - Email: " + admin.getEmail() + ", Role: " + admin.getRole() + ", Password: '" + admin.getMotDePasse() + "'");

            Utilisateur saved = utilisateurRepository.save(admin);
            System.out.println("✓ Admin user saved - ID: " + saved.getId() + ", Role: " + saved.getRole());

            Optional<Utilisateur> verify = utilisateurRepository.findByEmail("admin@mail.tn");
            if (verify.isPresent()) {
                Utilisateur verified = verify.orElseThrow(() -> new RuntimeException("Failed to verify admin user"));
                System.out.println("✓ Verified admin user exists in database");
                System.out.println("  ID: " + verified.getId() + ", Email: " + verified.getEmail() + ", Role: " + verified.getRole());
                System.out.println("  Password: '" + verified.getMotDePasse() + "' (length: " + verified.getMotDePasse().length() + ")");
            } else {
                System.out.println("✗ WARNING: Admin user not found after creation!");
            }

            return ResponseEntity.ok(Map.of(
                "message", "Admin user fixed successfully",
                "id", saved.getId(),
                "email", saved.getEmail(),
                "role", saved.getRole().name(),
                "password", "admin (plain text)"
            ));
        } catch (Exception e) {
            System.err.println("✗ ERROR in fix-admin: " + e.getMessage());
            e.printStackTrace();
            String errorMsg = e.getMessage();
            if (errorMsg == null) errorMsg = e.getClass().getSimpleName();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", errorMsg, "details", e.getClass().getSimpleName()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String email = request.email.trim();
            System.out.println("=== LOGIN ATTEMPT ===");
            System.out.println("Email: " + email);
            System.out.println("Password: " + request.password);

            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                System.out.println("✗ User not found: " + email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials.");
            }
            Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));

            System.out.println("✓ User found - ID: " + user.getId() + ", Email: " + user.getEmail() + ", Role: " + user.getRole());
            System.out.println("Password comparison:");
            System.out.println("  Input:    '" + request.password + "' (length: " + request.password.length() + ")");
            System.out.println("  Stored:   '" + user.getMotDePasse() + "' (length: " + (user.getMotDePasse() != null ? user.getMotDePasse().length() : 0) + ")");
            System.out.println("  Match:    " + request.password.equals(user.getMotDePasse()));

            if (!request.password.equals(user.getMotDePasse())) {
                System.out.println("✗ Password mismatch!");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials.");
            }

            System.out.println("✓ Password match! Login successful.");

            if (user.getRole() == null) {
                user.setRole(Utilisateur.Role.fan);
                utilisateurRepository.save(user);
            }

            System.out.println("Login - User: " + user.getEmail() + ", Role: " + user.getRole() + " (name: " + user.getRole().name() + ")");

            String token = generateToken(user);
            String roleName = user.getRole().name().toLowerCase(); 
            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("nom", user.getNom());
            userMap.put("email", user.getEmail());
            userMap.put("role", roleName);
            if (user.getProfilePicture() != null) {
                userMap.put("profilePicture", user.getProfilePicture());
            }
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", userMap
            ));
        } catch (IllegalArgumentException e) {

            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Login failed: Invalid user role. Please contact administrator.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(request.email);

            if (userOpt.isPresent()) {

                String resetToken = UUID.randomUUID().toString();
                resetTokens.put(resetToken, new PasswordResetInfo(request.email));

                return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, you will receive password reset instructions.",
                    "token", resetToken 
                ));
            } else {

                return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, you will receive password reset instructions."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to process password reset request.");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            if (request.newPassword == null || request.newPassword.length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 6 characters.");
            }

            if (request.token == null || request.token.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid reset token.");
            }

            PasswordResetInfo resetInfo = resetTokens.get(request.token);

            if (resetInfo == null || resetInfo.isExpired()) {
                resetTokens.remove(request.token); 
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired reset token.");
            }

            Optional<Utilisateur> userOpt = utilisateurRepository.findByEmail(resetInfo.email);

            if (userOpt.isEmpty()) {
                resetTokens.remove(request.token);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not found.");
            }

            Utilisateur user = userOpt.get();

            user.setMotDePasse(request.newPassword);
            utilisateurRepository.save(user);

            resetTokens.remove(request.token);

            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to reset password.");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
            }

            Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));

            if (request.containsKey("nom")) {
                user.setNom((String) request.get("nom"));
            }
            if (request.containsKey("email")) {
                String newEmail = (String) request.get("email");

                Optional<Utilisateur> existingUser = utilisateurRepository.findByEmail(newEmail);
                if (existingUser.isPresent()) {
                    Utilisateur existing = existingUser.orElseThrow();
                    if (!existing.getId().equals(user.getId())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already in use");
                    }
                }
                user.setEmail(newEmail);
            }
            if (request.containsKey("profilePicture")) {
                user.setProfilePicture((String) request.get("profilePicture"));
            }

            Utilisateur saved = utilisateurRepository.save(user);

            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", saved.getId());
            userMap.put("nom", saved.getNom());
            userMap.put("email", saved.getEmail());
            userMap.put("role", saved.getRole().name());
            userMap.put("profilePicture", saved.getProfilePicture());

            return ResponseEntity.ok(userMap);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating profile: " + e.getMessage());
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
            }

            Utilisateur user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));

            if (!user.getMotDePasse().equals(request.oldPassword)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password is incorrect");
            }

            if (request.newPassword == null || request.newPassword.length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("New password must be at least 6 characters");
            }

            user.setMotDePasse(request.newPassword);
            utilisateurRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error changing password: " + e.getMessage());
        }
    }

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<io.jsonwebtoken.Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    private String generateToken(Utilisateur user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(60L * 60 * 24 * 7))) 
                .signWith(JwtUtil.getKey())
                .compact();
    }

    public static class SignupRequest {
        public String nom;
        public String email;
        public String password;
        public Utilisateur.Role role;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class ForgotPasswordRequest {
        public String email;
    }

    public static class ResetPasswordRequest {
        public String token;
        public String newPassword;
    }

    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }
}