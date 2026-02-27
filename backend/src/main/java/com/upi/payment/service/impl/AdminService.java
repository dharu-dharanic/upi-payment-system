package com.upi.payment.service.impl;

import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.entity.Transaction;
import com.upi.payment.enums.AccountStatus;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.repository.TransactionRepository;
import com.upi.payment.repository.UserRepository;
import com.upi.payment.repository.WalletRepository;
import com.upi.payment.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public ApiResponse.DashboardStats getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAllByStatus(AccountStatus.ACTIVE, PageRequest.of(0, 1)).getTotalElements();
        long frozenAccounts = userRepository.findAllByStatus(AccountStatus.FROZEN, PageRequest.of(0, 1)).getTotalElements();
        long totalTransactions = transactionRepository.count();
        long flaggedTransactions = transactionRepository.findByIsFlaggedTrue(PageRequest.of(0, 1)).getTotalElements();

        BigDecimal todayVolume = transactionRepository.sumDailyTransferAmount(
            0L, LocalDateTime.now().toLocalDate().atStartOfDay());

        return ApiResponse.DashboardStats.builder()
            .totalUsers(totalUsers)
            .activeUsers(activeUsers)
            .frozenAccounts(frozenAccounts)
            .totalTransactions(totalTransactions)
            .flaggedTransactions(flaggedTransactions)
            .totalVolumeToday(todayVolume != null ? todayVolume : BigDecimal.ZERO)
            .totalVolumeMonth(BigDecimal.ZERO) // extend as needed
            .build();
    }

    @Transactional
    public void freezeAccount(Long targetUserId, Long adminId) {
        userRepository.findById(targetUserId)
            .orElseThrow(() -> new BusinessException("User not found"));

        userRepository.updateStatus(targetUserId, AccountStatus.FROZEN);
        auditService.log(adminId, "ACCOUNT_FROZEN", "Frozen user ID: " + targetUserId, "User", targetUserId, null, true);
    }

    @Transactional
    public void unfreezeAccount(Long targetUserId, Long adminId) {
        userRepository.findById(targetUserId)
            .orElseThrow(() -> new BusinessException("User not found"));

        userRepository.updateStatus(targetUserId, AccountStatus.ACTIVE);
        auditService.log(adminId, "ACCOUNT_UNFROZEN", "Unfrozen user ID: " + targetUserId, "User", targetUserId, null, true);
    }

    @Transactional(readOnly = true)
    public ApiResponse.PageResponse<ApiResponse.TransactionResponse> getFlaggedTransactions(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Transaction> result = transactionRepository.findByIsFlaggedTrue(pageable);

        List<ApiResponse.TransactionResponse> content = result.getContent().stream()
            .map(t -> ApiResponse.TransactionResponse.builder()
                .id(t.getId())
                .referenceId(t.getReferenceId())
                .senderName(t.getSender() != null ? t.getSender().getFullName() : null)
                .senderUpiId(t.getSender() != null ? t.getSender().getUpiId() : null)
                .receiverName(t.getReceiver() != null ? t.getReceiver().getFullName() : null)
                .receiverUpiId(t.getReceiver() != null ? t.getReceiver().getUpiId() : null)
                .amount(t.getAmount())
                .type(t.getType())
                .status(t.getStatus())
                .fraudRiskLevel(t.getFraudRiskLevel())
                .createdAt(t.getCreatedAt())
                .build())
            .toList();

        return ApiResponse.PageResponse.<ApiResponse.TransactionResponse>builder()
            .content(content)
            .pageNumber(result.getNumber())
            .pageSize(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .last(result.isLast())
            .build();
    }

    @Transactional(readOnly = true)
    public ApiResponse.PageResponse<ApiResponse.UserResponse> getAllUsers(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = userRepository.findAll(pageable);

        var content = result.getContent().stream()
            .map(u -> ApiResponse.UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .upiId(u.getUpiId())
                .role(u.getRole())
                .status(u.getStatus())
                .isVerified(u.getIsVerified())
                .createdAt(u.getCreatedAt())
                .build())
            .toList();

        return ApiResponse.PageResponse.<ApiResponse.UserResponse>builder()
            .content(content)
            .pageNumber(result.getNumber())
            .pageSize(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .last(result.isLast())
            .build();
    }
}
