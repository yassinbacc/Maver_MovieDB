package com.movie.gestionfilm.repository;

import com.movie.gestionfilm.model.FriendRequest;
import com.movie.gestionfilm.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Integer> {

    List<FriendRequest> findByReceiverAndStatus(Utilisateur receiver, FriendRequest.Status status);

    List<FriendRequest> findBySenderAndStatus(Utilisateur sender, FriendRequest.Status status);

    Optional<FriendRequest> findBySenderAndReceiver(Utilisateur sender, Utilisateur receiver);

    List<FriendRequest> findBySenderAndReceiverOrReceiverAndSender(
        Utilisateur user1, Utilisateur user2, Utilisateur user3, Utilisateur user4
    );

    @Query("SELECT fr FROM FriendRequest fr WHERE (fr.sender = :user OR fr.receiver = :user) AND fr.status = 'ACCEPTED'")
    List<FriendRequest> findFriendsByUser(@Param("user") Utilisateur user);

    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr WHERE " +
           "((fr.sender = :user1 AND fr.receiver = :user2) OR (fr.sender = :user2 AND fr.receiver = :user1)) " +
           "AND fr.status = 'ACCEPTED'")
    boolean areFriends(@Param("user1") Utilisateur user1, @Param("user2") Utilisateur user2);

    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr WHERE " +
           "((fr.sender = :user1 AND fr.receiver = :user2) OR (fr.sender = :user2 AND fr.receiver = :user1)) " +
           "AND fr.status = 'PENDING'")
    boolean hasPendingRequest(@Param("user1") Utilisateur user1, @Param("user2") Utilisateur user2);
}