package com.upi.payment.controller;

import com.upi.payment.dto.request.TransactionRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.service.impl.TransactionService;
import com.upi.payment.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "P2P transfer, deposit, history")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money to another user")
    public ResponseEntity<ApiResponse.Response<ApiResponse.TransactionResponse>> transfer(
            @Valid @RequestBody TransactionRequest.Transfer request,
            HttpServletRequest httpRequest) {
        var response = transactionService.transfer(
            SecurityUtils.getCurrentUserId(), request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.Response.success("Transfer successful", response));
    }

    @PostMapping("/add-money")
    @Operation(summary = "Add money from bank account to wallet")
    public ResponseEntity<ApiResponse.Response<ApiResponse.TransactionResponse>> addMoney(
            @Valid @RequestBody TransactionRequest.AddMoney request,
            HttpServletRequest httpRequest) {
        var response = transactionService.addMoney(
            SecurityUtils.getCurrentUserId(), request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.Response.success("Money added to wallet", response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get paginated transaction history")
    public ResponseEntity<ApiResponse.Response<ApiResponse.PageResponse<ApiResponse.TransactionResponse>>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var response = transactionService.getHistory(SecurityUtils.getCurrentUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.Response.success("Transaction history", response));
    }

    @GetMapping("/{referenceId}")
    @Operation(summary = "Get transaction by reference ID")
    public ResponseEntity<ApiResponse.Response<ApiResponse.TransactionResponse>> getByReference(
            @PathVariable String referenceId) {
        var response = transactionService.getByReference(referenceId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.Response.success("Transaction details", response));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
