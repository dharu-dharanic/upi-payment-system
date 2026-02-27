package com.upi.payment.controller;

import com.upi.payment.dto.request.AuthRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.service.impl.AuthService;
import com.upi.payment.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, Token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse.Response<ApiResponse.AuthResponse>> register(
            @Valid @RequestBody AuthRequest.Register request) {
        var response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.Response.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email/phone/UPI ID")
    public ResponseEntity<ApiResponse.Response<ApiResponse.AuthResponse>> login(
            @Valid @RequestBody AuthRequest.Login request) {
        var response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.Response.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse.Response<ApiResponse.AuthResponse>> refreshToken(
            @Valid @RequestBody AuthRequest.RefreshToken request) {
        var response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.Response.success("Token refreshed", response));
    }

    @PostMapping("/set-upi-pin")
    @Operation(summary = "Set or update UPI PIN")
    public ResponseEntity<ApiResponse.Response<Void>> setUpiPin(
            @Valid @RequestBody AuthRequest.SetUpiPin request) {
        authService.setUpiPin(SecurityUtils.getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.Response.success("UPI PIN set successfully", null));
    }
}
