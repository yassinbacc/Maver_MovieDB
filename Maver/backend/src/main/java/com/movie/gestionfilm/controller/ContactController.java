package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.ContactMessage;
import com.movie.gestionfilm.service.ContactMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private ContactMessageService contactMessageService;

    @PostMapping
    public ResponseEntity<?> submitMessage(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String email = request.get("email"); 
            String subject = request.get("subject");
            String message = request.get("message");

            if (name == null || name.trim().isEmpty() ||
                subject == null || subject.trim().isEmpty() ||
                message == null || message.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Name, subject, and message are required");
            }

            ContactMessage contactMessage = new ContactMessage();
            contactMessage.setName(name.trim());
            if (email != null && !email.trim().isEmpty()) {
                contactMessage.setEmail(email.trim());
            }
            contactMessage.setSubject(subject.trim());
            contactMessage.setMessage(message.trim());
            contactMessage.setRead(false);

            contactMessageService.saveMessage(contactMessage);

            return ResponseEntity.ok(Map.of("message", "Thank you for your message! We will get back to you soon."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error submitting message: " + e.getMessage());
        }
    }
}