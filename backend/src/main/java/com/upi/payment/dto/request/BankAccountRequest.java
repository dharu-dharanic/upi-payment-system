package com.upi.payment.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BankAccountRequest {

    @NotBlank(message = "Account number is required")
    @Size(min = 9, max = 18, message = "Invalid account number length")
    @Pattern(regexp = "^\\d+$", message = "Account number must contain only digits")
    private String accountNumber;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100)
    private String bankName;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;

    @NotBlank(message = "Account holder name is required")
    @Size(min = 2, max = 100)
    private String accountHolderName;

    private Boolean isPrimary = false;
}
