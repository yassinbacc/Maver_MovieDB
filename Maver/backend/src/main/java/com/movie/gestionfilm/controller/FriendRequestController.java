package com.movie.gestionfilm.controller;

import com.movie.gestionfilm.model.FriendRequest;
import com.movie.gestionfilm.model.Utilisateur;
import com.movie.gestionfilm.repository.UtilisateurRepository;
import com.movie.gestionfilm.service.FriendRequestService;
import com.movie.gestionfilm.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "*")
public class FriendRequestController {

    @Autowired
    private FriendRequestService friendRequestService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private Optional<Utilisateur> getUserFromAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return Optional.empty();
        String token = authHeader.substring(7);
        Optional<Claims> claims = JwtUtil.parse(token);
        Integer uid = claims.map(c -> c.get("uid", Integer.class)).orElse(null);
        if (uid == null) return Optional.empty();
        return utilisateurRepository.findById(uid);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam String query,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            List<Utilisateur> users = friendRequestService.searchUsers(query, userOpt.get().getId());

            List<Map<String, Object>> userData = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new java.util.HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("nom", user.getNom());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole().name());
                    return userMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error searching users: " + e.getMessage());
        }
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(
            @RequestBody Map<String, Integer> request,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            Integer receiverId = request.get("receiverId");
            if (receiverId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Receiver ID is required");
            }

            FriendRequest friendRequest = friendRequestService.sendFriendRequest(
                userOpt.get().getId(), receiverId);

            return ResponseEntity.ok(Map.of(
                "id", friendRequest.getId(),
                "message", "Friend request sent successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error sending friend request: " + e.getMessage());
        }
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<?> getIncomingRequests(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            List<FriendRequest> requests = friendRequestService.getIncomingRequests(userOpt.get().getId());

            List<Map<String, Object>> requestData = requests.stream()
                .map(req -> Map.of(
                    "id", req.getId(),
                    "sender", Map.of(
                        "id", req.getSender().getId(),
                        "nom", req.getSender().getNom(),
                        "email", req.getSender().getEmail()
                    ),
                    "status", req.getStatus().name(),
                    "createdAt", req.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(requestData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching incoming requests: " + e.getMessage());
        }
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<?> getOutgoingRequests(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            List<FriendRequest> requests = friendRequestService.getOutgoingRequests(userOpt.get().getId());

            List<Map<String, Object>> requestData = requests.stream()
                .map(req -> Map.of(
                    "id", req.getId(),
                    "receiver", Map.of(
                        "id", req.getReceiver().getId(),
                        "nom", req.getReceiver().getNom(),
                        "email", req.getReceiver().getEmail()
                    ),
                    "status", req.getStatus().name(),
                    "createdAt", req.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(requestData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching outgoing requests: " + e.getMessage());
        }
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<?> acceptFriendRequest(
            @PathVariable Integer requestId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            FriendRequest friendRequest = friendRequestService.acceptFriendRequest(
                requestId, userOpt.get().getId());

            return ResponseEntity.ok(Map.of(
                "id", friendRequest.getId(),
                "message", "Friend request accepted"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error accepting friend request: " + e.getMessage());
        }
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(
            @PathVariable Integer requestId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            friendRequestService.rejectFriendRequest(requestId, userOpt.get().getId());

            return ResponseEntity.ok(Map.of("message", "Friend request rejected"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error rejecting friend request: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getFriends(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            List<Utilisateur> friends = friendRequestService.getFriends(userOpt.get().getId());

            List<Map<String, Object>> friendData = friends.stream()
                .map(friend -> {
                    Map<String, Object> friendMap = new java.util.HashMap<>();
                    friendMap.put("id", friend.getId());
                    friendMap.put("nom", friend.getNom());
                    friendMap.put("email", friend.getEmail());
                    friendMap.put("role", friend.getRole().name());
                    return friendMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(friendData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching friends: " + e.getMessage());
        }
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<?> cancelFriendRequest(
            @PathVariable Integer requestId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            friendRequestService.cancelFriendRequest(requestId, userOpt.get().getId());

            return ResponseEntity.ok(Map.of("message", "Friend request cancelled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error cancelling friend request: " + e.getMessage());
        }
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<?> removeFriend(
            @PathVariable Integer friendId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            Optional<Utilisateur> userOpt = getUserFromAuth(auth);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            friendRequestService.removeFriend(userOpt.get().getId(), friendId);

            return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error removing friend: " + e.getMessage());
        }
    }
}