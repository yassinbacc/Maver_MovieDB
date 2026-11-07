package com.movie.gestionfilm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get("uploads/profile-pictures").toAbsolutePath().toString();
        registry.addResourceHandler("/api/files/profile-pictures/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
