package com.upi.payment.controller;

import com.upi.payment.dto.request.BankAccountRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.service.impl.BankAccountService;
import com.upi.payment.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bank-accounts")
@RequiredArgsConstructor
@Tag(name = "Bank Accounts", description = "Link and manage bank accounts")
@SecurityRequirement(name = "bearerAuth")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @PostMapping
    @Operation(summary = "Link a new bank account")
    public ResponseEntity<ApiResponse.Response<ApiResponse.BankAccountResponse>> linkAccount(
            @Valid @RequestBody BankAccountRequest request) {
        var response = bankAccountService.linkAccount(SecurityUtils.getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.Response.success("Bank account linked", response));
    }

    @GetMapping
    @Operation(summary = "Get all linked bank accounts")
    public ResponseEntity<ApiResponse.Response<List<ApiResponse.BankAccountResponse>>> getAccounts() {
        var response = bankAccountService.getAccounts(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.Response.success("Bank accounts", response));
    }

    @DeleteMapping("/{accountId}")
    @Operation(summary = "Remove a linked bank account")
    public ResponseEntity<ApiResponse.Response<Void>> removeAccount(@PathVariable Long accountId) {
        bankAccountService.removeAccount(SecurityUtils.getCurrentUserId(), accountId);
        return ResponseEntity.ok(ApiResponse.Response.success("Bank account removed", null));
    }
}
