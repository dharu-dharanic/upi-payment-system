package com.upi.payment.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

public class TransactionRequest {

    @Data
    public static class Transfer {
        @NotBlank(message = "Receiver identifier is required (UPI ID / phone / email)")
        private String receiverIdentifier;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1.00", message = "Minimum transfer amount is ₹1")
        @DecimalMax(value = "50000.00", message = "Maximum single transfer is ₹50,000")
        @Digits(integer = 10, fraction = 2)
        private BigDecimal amount;

        @Size(max = 200, message = "Description too long")
        private String description;

        @NotBlank(message = "UPI PIN is required")
        @Pattern(regexp = "^\\d{4}(\\d{2})?$", message = "Invalid UPI PIN")
        private String upiPin;

        // Client-supplied idempotency key to prevent duplicate payments
        @NotBlank(message = "Idempotency key is required")
        @Size(min = 10, max = 100)
        private String idempotencyKey;
    }

    @Data
    public static class AddMoney {
        @NotNull(message = "Bank account ID required")
        private Long bankAccountId;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1.00", message = "Minimum deposit is ₹1")
        @DecimalMax(value = "100000.00", message = "Maximum deposit is ₹1,00,000")
        private BigDecimal amount;

        @NotBlank(message = "Idempotency key is required")
        private String idempotencyKey;
    }

    @Data
    public static class FilterRequest {
        private String status;
        private String type;
        private String startDate;
        private String endDate;
        private int page = 0;
        private int size = 20;
    }
}
