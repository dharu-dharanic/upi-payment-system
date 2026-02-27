package com.upi.payment.entity;

import com.upi.payment.enums.FraudRiskLevel;
import com.upi.payment.enums.TransactionStatus;
import com.upi.payment.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_txn_reference", columnList = "reference_id", unique = true),
    @Index(name = "idx_txn_sender", columnList = "sender_id"),
    @Index(name = "idx_txn_receiver", columnList = "receiver_id"),
    @Index(name = "idx_txn_status", columnList = "status"),
    @Index(name = "idx_txn_created", columnList = "created_at"),
    @Index(name = "idx_txn_idempotency", columnList = "idempotency_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique reference for every transaction (shown to user)
    @Column(name = "reference_id", nullable = false, unique = true, length = 50)
    private String referenceId;

    // Idempotency key supplied by client to prevent duplicate payments
    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_risk_level", length = 20)
    @Builder.Default
    private FraudRiskLevel fraudRiskLevel = FraudRiskLevel.LOW;

    @Column(length = 500)
    private String description;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "sender_balance_before", precision = 15, scale = 2)
    private BigDecimal senderBalanceBefore;

    @Column(name = "sender_balance_after", precision = 15, scale = 2)
    private BigDecimal senderBalanceAfter;

    @Column(name = "receiver_balance_before", precision = 15, scale = 2)
    private BigDecimal receiverBalanceBefore;

    @Column(name = "receiver_balance_after", precision = 15, scale = 2)
    private BigDecimal receiverBalanceAfter;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_info", length = 200)
    private String deviceInfo;

    @Column(name = "fraud_score")
    @Builder.Default
    private Integer fraudScore = 0;

    @Column(name = "is_flagged")
    @Builder.Default
    private Boolean isFlagged = false;
}
