package com.upi.payment.service.impl;

import com.upi.payment.dto.request.BankAccountRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.entity.BankAccount;
import com.upi.payment.entity.User;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.repository.BankAccountRepository;
import com.upi.payment.repository.UserRepository;
import com.upi.payment.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public ApiResponse.BankAccountResponse linkAccount(Long userId, BankAccountRequest request) {
        if (bankAccountRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new BusinessException("This bank account is already linked to an account");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found"));

        // If this is the first account, make it primary
        List<BankAccount> existing = bankAccountRepository.findByUserId(userId);
        boolean isPrimary = existing.isEmpty() || request.getIsPrimary();

        if (isPrimary) {
            // Unset previous primary
            existing.stream()
                .filter(BankAccount::getIsPrimary)
                .forEach(acc -> {
                    acc.setIsPrimary(false);
                    bankAccountRepository.save(acc);
                });
        }

        BankAccount account = BankAccount.builder()
            .user(user)
            .accountNumber(request.getAccountNumber())
            .bankName(request.getBankName())
            .ifscCode(request.getIfscCode().toUpperCase())
            .accountHolderName(request.getAccountHolderName())
            .isPrimary(isPrimary)
            .build();

        account = bankAccountRepository.save(account);
        auditService.log(userId, "BANK_ACCOUNT_LINKED", "Account: " + maskAccountNumber(account.getAccountNumber()),
            "BankAccount", account.getId(), null, true);

        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public List<ApiResponse.BankAccountResponse> getAccounts(Long userId) {
        return bankAccountRepository.findByUserId(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void removeAccount(Long userId, Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
            .orElseThrow(() -> new BusinessException("Bank account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied");
        }

        bankAccountRepository.delete(account);
        auditService.log(userId, "BANK_ACCOUNT_REMOVED", "Account ID: " + accountId,
            "BankAccount", accountId, null, true);
    }

    private ApiResponse.BankAccountResponse toResponse(BankAccount account) {
        return ApiResponse.BankAccountResponse.builder()
            .id(account.getId())
            .maskedAccountNumber(maskAccountNumber(account.getAccountNumber()))
            .bankName(account.getBankName())
            .ifscCode(account.getIfscCode())
            .accountHolderName(account.getAccountHolderName())
            .bankBalance(account.getBankBalance())
            .status(account.getStatus())
            .isPrimary(account.getIsPrimary())
            .isVerified(account.getIsVerified())
            .build();
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber.length() <= 4) return accountNumber;
        return "XXXX-XXXX-" + accountNumber.substring(accountNumber.length() - 4);
    }
}
