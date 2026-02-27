package com.upi.payment.entity;

import com.upi.payment.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "bank_accounts", indexes = {
    @Index(name = "idx_bank_account_number", columnList = "account_number", unique = true),
    @Index(name = "idx_bank_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "account_number", nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "ifsc_code", nullable = false, length = 15)
    private String ifscCode;

    @Column(name = "account_holder_name", nullable = false, length = 100)
    private String accountHolderName;

    // Simulated bank balance (not real)
    @Column(name = "bank_balance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bankBalance = new BigDecimal("50000.00");

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = true;  // Auto-verified in simulation

    @Version
    private Long version;
}
