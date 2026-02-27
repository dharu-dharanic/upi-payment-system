package com.upi.payment.controller;

import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.service.impl.AdminService;
import com.upi.payment.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Admin-only endpoints")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard statistics")
    public ResponseEntity<ApiResponse.Response<ApiResponse.DashboardStats>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.Response.success("Dashboard stats", adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users")
    public ResponseEntity<ApiResponse.Response<ApiResponse.PageResponse<ApiResponse.UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.Response.success("Users", adminService.getAllUsers(page, size)));
    }

    @PatchMapping("/users/{userId}/freeze")
    @Operation(summary = "Freeze a user account")
    public ResponseEntity<ApiResponse.Response<Void>> freeze(@PathVariable Long userId) {
        adminService.freezeAccount(userId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.Response.success("Account frozen", null));
    }

    @PatchMapping("/users/{userId}/unfreeze")
    @Operation(summary = "Unfreeze a user account")
    public ResponseEntity<ApiResponse.Response<Void>> unfreeze(@PathVariable Long userId) {
        adminService.unfreezeAccount(userId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.Response.success("Account unfrozen", null));
    }

    @GetMapping("/transactions/flagged")
    @Operation(summary = "Get all flagged transactions")
    public ResponseEntity<ApiResponse.Response<ApiResponse.PageResponse<ApiResponse.TransactionResponse>>> flagged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.Response.success("Flagged transactions", adminService.getFlaggedTransactions(page, size)));
    }
}
