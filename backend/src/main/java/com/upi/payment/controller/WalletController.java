package com.upi.payment.controller;

import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.service.impl.WalletService;
import com.upi.payment.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "Wallet balance and operations")
@SecurityRequirement(name = "bearerAuth")
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    @Operation(summary = "Get current wallet details")
    public ResponseEntity<ApiResponse.Response<ApiResponse.WalletResponse>> getWallet() {
        var response = walletService.getWallet(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.Response.success("Wallet details", response));
    }
}
