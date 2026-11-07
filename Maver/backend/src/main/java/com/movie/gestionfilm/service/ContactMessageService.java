package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.ContactMessage;
import com.movie.gestionfilm.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ContactMessageService {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    public ContactMessage saveMessage(ContactMessage message) {
        if (message == null) {
            throw new IllegalArgumentException("ContactMessage cannot be null");
        }
        return contactMessageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ContactMessage> getAllMessages() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<ContactMessage> getMessageById(Integer id) {
        if (id == null) {
            return Optional.empty();
        }
        return contactMessageRepository.findById(id);
    }

    public ContactMessage markAsRead(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Message id cannot be null");
        }
        ContactMessage message = contactMessageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setRead(true);
        return contactMessageRepository.save(message);
    }

    public void deleteMessage(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Message id cannot be null");
        }
        contactMessageRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Long getUnreadCount() {
        return contactMessageRepository.countUnreadMessages();
    }
}