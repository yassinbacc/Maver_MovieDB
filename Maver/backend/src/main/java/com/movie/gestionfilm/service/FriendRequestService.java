package com.movie.gestionfilm.service;

import com.movie.gestionfilm.model.FriendRequest;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.FriendRequestRepository;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FriendRequestService {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public List<Utilisateur> searchUsers(String query, Integer currentUserId) {
        List<Utilisateur> allUsers = utilisateurRepository.findAll();

        return allUsers.stream()
            .filter(user -> 
                !user.getId().equals(currentUserId) && 
                user.getRole() != Utilisateur.Role.acteur && 
                (user.getNom().toLowerCase().contains(query.toLowerCase()) ||
                 user.getEmail().toLowerCase().contains(query.toLowerCase()))
            )
            .collect(Collectors.toList());
    }

    public FriendRequest sendFriendRequest(Integer senderId, Integer receiverId) {
        if (senderId == null || receiverId == null) {
            throw new IllegalArgumentException("Sender ID and Receiver ID cannot be null");
        }
        if (senderId.equals(receiverId)) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }

        Utilisateur sender = utilisateurRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));
        Utilisateur receiver = utilisateurRepository.findById(receiverId)
            .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (sender.getRole() == Utilisateur.Role.acteur) {
            throw new RuntimeException("Actors cannot send friend requests");
        }
        if (receiver.getRole() == Utilisateur.Role.acteur) {
            throw new RuntimeException("Cannot send friend request to actors");
        }

        Optional<FriendRequest> existing = friendRequestRepository.findBySenderAndReceiver(sender, receiver);
        if (existing.isPresent()) {
            FriendRequest request = existing.orElseThrow(() -> new RuntimeException("Request not found"));
            if (request.getStatus() == FriendRequest.Status.PENDING) {
                throw new RuntimeException("Friend request already pending");
            } else if (request.getStatus() == FriendRequest.Status.ACCEPTED) {
                throw new RuntimeException("Users are already friends");
            }
        }

        Optional<FriendRequest> reverse = friendRequestRepository.findBySenderAndReceiver(receiver, sender);
        if (reverse.isPresent()) {
            FriendRequest request = reverse.orElseThrow(() -> new RuntimeException("Request not found"));
            if (request.getStatus() == FriendRequest.Status.PENDING) {
                throw new RuntimeException("You have a pending request from this user. Please accept it instead.");
            } else if (request.getStatus() == FriendRequest.Status.ACCEPTED) {
                throw new RuntimeException("Users are already friends");
            }
        }

        if (friendRequestRepository.areFriends(sender, receiver)) {
            throw new RuntimeException("Users are already friends");
        }

        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(sender);
        friendRequest.setReceiver(receiver);
        friendRequest.setStatus(FriendRequest.Status.PENDING);

        return friendRequestRepository.save(friendRequest);
    }

    public FriendRequest acceptFriendRequest(Integer requestId, Integer userId) {
        if (requestId == null || userId == null) {
            throw new IllegalArgumentException("Request ID and User ID cannot be null");
        }
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (request.getReceiver() == null || request.getReceiver().getId() == null || !request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You can only accept requests sent to you");
        }

        if (request.getStatus() != FriendRequest.Status.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        request.setStatus(FriendRequest.Status.ACCEPTED);
        return friendRequestRepository.save(request);
    }

    public void rejectFriendRequest(Integer requestId, Integer userId) {
        if (requestId == null || userId == null) {
            throw new IllegalArgumentException("Request ID and User ID cannot be null");
        }
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (request.getReceiver() == null || request.getReceiver().getId() == null || !request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You can only reject requests sent to you");
        }

        friendRequestRepository.delete(request);
    }

    public void cancelFriendRequest(Integer requestId, Integer userId) {
        if (requestId == null || userId == null) {
            throw new IllegalArgumentException("Request ID and User ID cannot be null");
        }
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (request.getSender() == null || request.getSender().getId() == null || !request.getSender().getId().equals(userId)) {
            throw new RuntimeException("You can only cancel requests sent by you");
        }

        friendRequestRepository.delete(request);
    }

    public void removeFriend(Integer userId, Integer friendId) {
        if (userId == null || friendId == null) {
            throw new IllegalArgumentException("User ID and Friend ID cannot be null");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        utilisateurRepository.findById(friendId)
            .orElseThrow(() -> new RuntimeException("Friend not found"));

        List<FriendRequest> friendRequests = friendRequestRepository.findFriendsByUser(user);
        Optional<FriendRequest> request = friendRequests.stream()
            .filter(fr -> {
                if (fr.getSender() == null || fr.getSender().getId() == null || 
                    fr.getReceiver() == null || fr.getReceiver().getId() == null) {
                    return false;
                }
                return fr.getSender().getId().equals(friendId) || fr.getReceiver().getId().equals(friendId);
            })
            .findFirst();

        if (request.isPresent()) {
            FriendRequest req = request.orElseThrow(() -> new RuntimeException("Request not found"));
            friendRequestRepository.delete(req);
        } else {
            throw new RuntimeException("Friendship not found");
        }
    }

    public List<FriendRequest> getIncomingRequests(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return friendRequestRepository.findByReceiverAndStatus(user, FriendRequest.Status.PENDING);
    }

    public List<FriendRequest> getOutgoingRequests(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return friendRequestRepository.findBySenderAndStatus(user, FriendRequest.Status.PENDING);
    }

    public List<Utilisateur> getFriends(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<FriendRequest> friendRequests = friendRequestRepository.findFriendsByUser(user);

        return friendRequests.stream()
            .filter(fr -> fr.getSender() != null && fr.getSender().getId() != null && 
                         fr.getReceiver() != null && fr.getReceiver().getId() != null)
            .map(fr -> fr.getSender().getId().equals(userId) ? fr.getReceiver() : fr.getSender())
            .collect(Collectors.toList());
    }
}