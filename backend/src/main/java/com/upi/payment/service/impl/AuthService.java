package com.upi.payment.service.impl;

import com.upi.payment.dto.request.AuthRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.entity.User;
import com.upi.payment.entity.Wallet;
import com.upi.payment.enums.AccountStatus;
import com.upi.payment.enums.UserRole;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.repository.UserRepository;
import com.upi.payment.repository.WalletRepository;
import com.upi.payment.security.JwtService;
import com.upi.payment.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final AuditService auditService;

    @Transactional
    public ApiResponse.AuthResponse register(AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException("Phone number already registered");
        }

        String upiId = generateUpiId(request.getPhoneNumber());

        User user = User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail().toLowerCase())
            .phoneNumber(request.getPhoneNumber())
            .password(passwordEncoder.encode(request.getPassword()))
            .upiId(upiId)
            .role(UserRole.ROLE_USER)
            .status(AccountStatus.ACTIVE)
            .isVerified(true)  // Auto-verified in simulation
            .build();

        user = userRepository.save(user);

        // Create wallet automatically on registration
        Wallet wallet = Wallet.builder()
            .user(user)
            .build();
        walletRepository.save(wallet);

        log.info("New user registered: {} with UPI ID: {}", user.getEmail(), upiId);
        auditService.log(user.getId(), "USER_REGISTERED", "User registered successfully", "User", user.getId(), null, true);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(userDetails, user);
    }

    public ApiResponse.AuthResponse login(AuthRequest.Login request) {
        User user = userRepository.findByIdentifier(request.getIdentifier())
            .orElseThrow(() -> new BusinessException("Invalid credentials"));

        if (user.getStatus() == AccountStatus.FROZEN || user.getStatus() == AccountStatus.SUSPENDED) {
            throw new BusinessException("Account is " + user.getStatus().name().toLowerCase() + ". Contact support.");
        }

        if (user.getFailedLoginAttempts() >= 5) {
            throw new LockedException("Account locked due to too many failed attempts");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
            userRepository.resetFailedLoginAttempts(user.getId());
            auditService.log(user.getId(), "USER_LOGIN", "Login successful", "User", user.getId(), null, true);

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            return buildAuthResponse(userDetails, user);

        } catch (BadCredentialsException e) {
            userRepository.incrementFailedLoginAttempts(user.getId());
            auditService.log(user.getId(), "LOGIN_FAILED", "Invalid password attempt", "User", user.getId(), null, false);
            throw new BusinessException("Invalid credentials");
        }
    }

    public ApiResponse.AuthResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new BusinessException("Invalid or expired refresh token");
        }

        User user = userRepository.findByEmail(username)
            .orElseThrow(() -> new BusinessException("User not found"));

        return buildAuthResponse(userDetails, user);
    }

    @Transactional
    public void setUpiPin(Long userId, AuthRequest.SetUpiPin request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Incorrect password");
        }

        user.setUpiPin(passwordEncoder.encode(request.getUpiPin()));
        userRepository.save(user);

        auditService.log(userId, "UPI_PIN_SET", "UPI PIN configured", "User", userId, null, true);
        log.info("UPI PIN set for user: {}", userId);
    }

    private String generateUpiId(String phoneNumber) {
        String base = phoneNumber + "@upi";
        while (userRepository.existsByUpiId(base)) {
            base = phoneNumber + UUID.randomUUID().toString().substring(0, 4) + "@upi";
        }
        return base;
    }

    private ApiResponse.AuthResponse buildAuthResponse(UserDetails userDetails, User user) {
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return ApiResponse.AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtService.getExpirationTime())
            .user(ApiResponse.UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .upiId(user.getUpiId())
                .role(user.getRole())
                .status(user.getStatus())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build())
            .build();
    }
}
