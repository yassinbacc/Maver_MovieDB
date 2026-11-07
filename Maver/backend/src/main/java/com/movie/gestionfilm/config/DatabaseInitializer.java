package com.movie.gestionfilm.config;

import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class DatabaseInitializer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @PostConstruct
    @Transactional
    public void initializeDatabase() {
        System.out.println("\n\n========================================");
        System.out.println("=== DATABASE INITIALIZATION STARTING ===");
        System.out.println("========================================\n");
        try {
            boolean tableExists = checkTableExists("community_posts");
            System.out.println("community_posts table exists: " + tableExists);

            if (!tableExists) {
                System.out.println("Creating community_posts table...");
                createCommunityPostsTable();
            }

            boolean postMoviesExists = checkTableExists("post_movies");
            System.out.println("post_movies table exists: " + postMoviesExists);

            if (!postMoviesExists) {
                System.out.println("Creating post_movies table...");
                createPostMoviesTable();
            }

            boolean postActorsExists = checkTableExists("post_actors");
            System.out.println("post_actors table exists: " + postActorsExists);

            if (!postActorsExists) {
                System.out.println("Creating post_actors table...");
                createPostActorsTable();
            }

            boolean postReactionsExists = checkTableExists("post_reactions");
            System.out.println("post_reactions table exists: " + postReactionsExists);

            if (!postReactionsExists) {
                System.out.println("Creating post_reactions table...");
                createPostReactionsTable();
            }

            try {
                Long postCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM community_posts", Long.class);
                System.out.println("✓ Total posts in database: " + (postCount != null ? postCount : 0));
            } catch (Exception e) {
                System.err.println("✗ ERROR querying posts table: " + e.getMessage());
                System.err.println("This might mean the table wasn't created properly");
                e.printStackTrace();
            }

            try {
                System.out.println("\n=== ADMIN USER SETUP ===");

                Optional<Utilisateur> existingAdminOpt = utilisateurRepository.findByEmail("admin@mail.tn");
                if (existingAdminOpt.isPresent()) {
                    Utilisateur existingAdmin = existingAdminOpt.get();
                    System.out.println("✓ Found existing admin user, deleting it...");
                    utilisateurRepository.delete(existingAdmin);
                    System.out.println("✓ Deleted existing admin user");
                } else {
                    System.out.println("✓ No existing admin user found");
                }

                System.out.println("Creating new admin user...");
                Utilisateur admin = new Utilisateur();
                admin.setNom("Admin");
                admin.setEmail("admin@mail.tn");
                admin.setMotDePasse("admin");
                admin.setRole(Utilisateur.Role.admin);

                Utilisateur savedAdmin = utilisateurRepository.save(admin);
                System.out.println("✓ Admin user created successfully:");
                System.out.println("  ID: " + savedAdmin.getId());
                System.out.println("  Email: admin@mail.tn");
                System.out.println("  Password: admin");
                System.out.println("  Role: " + savedAdmin.getRole());

                Optional<Utilisateur> verified = utilisateurRepository.findByEmail("admin@mail.tn");
                verified.ifPresentOrElse(v -> {
                    System.out.println("✓ Verified admin user in database:");
                    System.out.println("  ID: " + v.getId());
                    System.out.println("  Email: " + v.getEmail());
                    System.out.println("  Role: " + v.getRole());
                    System.out.println("  Password length: " + (v.getMotDePasse() != null ? v.getMotDePasse().length() : 0));
                }, () -> {
                    System.err.println("✗ WARNING: Admin user not found after creation!");
                });
                System.out.println("=== ADMIN USER SETUP COMPLETE ===\n");
            } catch (Exception e) {
                System.err.println("✗ ERROR creating admin user: " + e.getMessage());
                e.printStackTrace();
            }

            try {
                System.out.println("Checking for users with invalid roles...");
                String fixRolesSql = "UPDATE utilisateurs SET role = 'fan' WHERE role IS NULL OR role NOT IN ('fan', 'acteur', 'realisateur', 'admin')";
                int fixedCount = jdbcTemplate.update(fixRolesSql);
                if (fixedCount > 0) {
                    System.out.println("✓ Fixed " + fixedCount + " user(s) with invalid roles");
                }
            } catch (Exception e) {
                System.err.println("✗ ERROR fixing invalid roles: " + e.getMessage());
                e.printStackTrace();
            }

            try {
                System.out.println("Checking contact_messages table...");
                if (checkTableExists("contact_messages")) {
                    String checkColumnSql = "SELECT IS_NULLABLE FROM information_schema.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'email'";
                    try {
                        String isNullable = jdbcTemplate.queryForObject(checkColumnSql, String.class);
                        if ("NO".equals(isNullable)) {
                            System.out.println("Fixing contact_messages.email column to be nullable...");
                            String fixEmailSql = "ALTER TABLE contact_messages MODIFY COLUMN email VARCHAR(255) NULL";
                            jdbcTemplate.update(fixEmailSql);
                            System.out.println("✓ Fixed contact_messages.email column (now nullable)");
                        } else {
                            System.out.println("✓ contact_messages.email column is already nullable");
                        }
                    } catch (Exception e) {
                        System.out.println("contact_messages.email column doesn't exist yet (will be created correctly)");
                    }
                }
            } catch (Exception e) {
                System.err.println("✗ ERROR fixing contact_messages table: " + e.getMessage());
            }

            try {
                System.out.println("Checking favorite_actors table...");
                if (checkTableExists("favorite_actors")) {
                    String checkColumnSql = "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'favorite_actors' AND COLUMN_NAME = 'profile_image_url'";
                    try {
                        Integer count = jdbcTemplate.queryForObject(checkColumnSql, Integer.class);
                        if (count == null || count == 0) {
                            System.out.println("Adding profile_image_url column to favorite_actors table...");
                            String addColumnSql = "ALTER TABLE favorite_actors ADD COLUMN profile_image_url VARCHAR(500) NULL";
                            jdbcTemplate.update(addColumnSql);
                            System.out.println("✓ Added profile_image_url column to favorite_actors table");
                        } else {
                            System.out.println("✓ favorite_actors.profile_image_url column already exists");
                        }
                    } catch (Exception e) {
                        System.err.println("✗ ERROR checking profile_image_url column: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("✗ ERROR fixing favorite_actors table: " + e.getMessage());
            }

            System.out.println("\n========================================");
            System.out.println("=== DATABASE INITIALIZATION COMPLETE ===");
            System.out.println("========================================\n");
        } catch (Exception e) {
            System.err.println("\n========================================");
            System.err.println("=== DATABASE INITIALIZATION FAILED ===");
            System.err.println("========================================");
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.err.println("========================================\n");
        }
    }

    private boolean checkTableExists(String tableName) {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void createCommunityPostsTable() {
        String sql = "CREATE TABLE IF NOT EXISTS `community_posts` (" +
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " +
            "`user_id` INT(11) NOT NULL, " +
            "`content` TEXT NOT NULL, " +
            "`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
            "PRIMARY KEY (`id`), " +
            "INDEX `idx_user_id` (`user_id`), " +
            "INDEX `idx_created_at` (`created_at`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        jdbcTemplate.execute(sql);
    }

    private void createPostMoviesTable() {
        String sql = "CREATE TABLE IF NOT EXISTS `post_movies` (" +
            "`post_id` INT(11) NOT NULL, " +
            "`movie_tmdb_id` INT(11) NOT NULL, " +
            "PRIMARY KEY (`post_id`, `movie_tmdb_id`), " +
            "INDEX `idx_post_id` (`post_id`), " +
            "INDEX `idx_movie_tmdb_id` (`movie_tmdb_id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        jdbcTemplate.execute(sql);
    }

    private void createPostActorsTable() {
        String sql = "CREATE TABLE IF NOT EXISTS `post_actors` (" +
            "`post_id` INT(11) NOT NULL, " +
            "`actor_tmdb_id` INT(11) NOT NULL, " +
            "PRIMARY KEY (`post_id`, `actor_tmdb_id`), " +
            "INDEX `idx_post_id` (`post_id`), " +
            "INDEX `idx_actor_tmdb_id` (`actor_tmdb_id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        jdbcTemplate.execute(sql);
    }

    private void createPostReactionsTable() {
        String sql = "CREATE TABLE IF NOT EXISTS `post_reactions` (" +
            "`id` INT(11) NOT NULL AUTO_INCREMENT, " +
            "`post_id` INT(11) NOT NULL, " +
            "`user_id` INT(11) NOT NULL, " +
            "`reaction_type` VARCHAR(20) NOT NULL, " +
            "`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
            "`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
            "PRIMARY KEY (`id`), " +
            "UNIQUE KEY `unique_post_user` (`post_id`, `user_id`), " +
            "INDEX `idx_post_id` (`post_id`), " +
            "INDEX `idx_user_id` (`user_id`), " +
            "INDEX `idx_reaction_type` (`reaction_type`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        jdbcTemplate.execute(sql);
    }
}