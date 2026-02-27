package com.upi.payment.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthRequest {

    @Data
    public static class Register {
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100)
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
        private String phoneNumber;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
                 message = "Password must have uppercase, lowercase, digit, and special character")
        private String password;
    }

    @Data
    public static class Login {
        @NotBlank(message = "Email or phone is required")
        private String identifier;  // email, phone, or UPI ID

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class SetUpiPin {
        @NotBlank(message = "UPI PIN is required")
        @Pattern(regexp = "^\\d{4}(\\d{2})?$", message = "UPI PIN must be 4 or 6 digits")
        private String upiPin;

        @NotBlank(message = "Password confirmation required")
        private String password;
    }

    @Data
    public static class RefreshToken {
        @NotBlank
        private String refreshToken;
    }
}
