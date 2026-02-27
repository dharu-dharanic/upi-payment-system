package com.upi.payment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets", indexes = {
    @Index(name = "idx_wallet_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "daily_spent", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal dailySpent = BigDecimal.ZERO;

    @Column(name = "daily_limit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal dailyLimit = new BigDecimal("100000.00");

    // Optimistic locking — prevents race conditions on concurrent balance updates
    @Version
    private Long version;

    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    public boolean isDailyLimitExceeded(BigDecimal amount) {
        return this.dailySpent.add(amount).compareTo(this.dailyLimit) > 0;
    }

    public void debit(BigDecimal amount) {
        if (!hasSufficientBalance(amount)) {
            throw new IllegalStateException("Insufficient wallet balance");
        }
        this.balance = this.balance.subtract(amount);
        this.dailySpent = this.dailySpent.add(amount);
    }

    public void credit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }
}
