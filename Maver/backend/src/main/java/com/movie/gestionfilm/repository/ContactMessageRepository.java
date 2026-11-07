package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Integer> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(c) FROM ContactMessage c WHERE c.read = false")
    Long countUnreadMessages();
}


