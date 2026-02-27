package com.upi.payment.dto.response;

import com.upi.payment.enums.AccountStatus;
import com.upi.payment.enums.FraudRiskLevel;
import com.upi.payment.enums.TransactionStatus;
import com.upi.payment.enums.TransactionType;
import com.upi.payment.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ApiResponse {

    // Generic wrapper for all API responses
    @Data
    @Builder
    public static class Response<T> {
        private boolean success;
        private String message;
        private T data;
        private String timestamp;

        public static <T> Response<T> success(String message, T data) {
            return Response.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now().toString())
                .build();
        }

        public static <T> Response<T> error(String message) {
            return Response.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now().toString())
                .build();
        }
    }

    // Auth
    @Data
    @Builder
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private long expiresIn;
        private UserResponse user;
    }

    // User
    @Data
    @Builder
    public static class UserResponse {
        private Long id;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String upiId;
        private UserRole role;
        private AccountStatus status;
        private Boolean isVerified;
        private LocalDateTime createdAt;
    }

    // Wallet
    @Data
    @Builder
    public static class WalletResponse {
        private Long id;
        private BigDecimal balance;
        private BigDecimal dailySpent;
        private BigDecimal dailyLimit;
        private BigDecimal availableToday;
    }

    // Bank Account
    @Data
    @Builder
    public static class BankAccountResponse {
        private Long id;
        private String maskedAccountNumber;  // Last 4 digits only
        private String bankName;
        private String ifscCode;
        private String accountHolderName;
        private BigDecimal bankBalance;
        private AccountStatus status;
        private Boolean isPrimary;
        private Boolean isVerified;
    }

    // Transaction
    @Data
    @Builder
    public static class TransactionResponse {
        private Long id;
        private String referenceId;
        private String senderName;
        private String senderUpiId;
        private String receiverName;
        private String receiverUpiId;
        private BigDecimal amount;
        private BigDecimal fee;
        private TransactionType type;
        private TransactionStatus status;
        private FraudRiskLevel fraudRiskLevel;
        private String description;
        private String failureReason;
        private BigDecimal balanceAfter;
        private LocalDateTime processedAt;
        private LocalDateTime createdAt;
    }

    // Admin Dashboard
    @Data
    @Builder
    public static class DashboardStats {
        private long totalUsers;
        private long activeUsers;
        private long frozenAccounts;
        private long totalTransactions;
        private long successfulTransactions;
        private long flaggedTransactions;
        private BigDecimal totalVolumeToday;
        private BigDecimal totalVolumeMonth;
    }

    // Paginated response
    @Data
    @Builder
    public static class PageResponse<T> {
        private List<T> content;
        private int pageNumber;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
