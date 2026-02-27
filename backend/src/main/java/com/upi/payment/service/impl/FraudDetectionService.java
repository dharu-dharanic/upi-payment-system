package com.upi.payment.service.impl;

import com.upi.payment.entity.Transaction;
import com.upi.payment.entity.User;
import com.upi.payment.enums.FraudRiskLevel;
import com.upi.payment.enums.TransactionType;
import com.upi.payment.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Fraud Detection Engine
 * Calculates a risk score (0–100) per transaction based on:
 *  - Transaction velocity (too many in short window)
 *  - High-value amount flag
 *  - Unusual time of day
 *  - First transaction to this recipient
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {

    private final TransactionRepository transactionRepository;

    @Value("${app.fraud.max-transactions-per-hour:10}")
    private int maxTxnPerHour;

    @Value("${app.fraud.high-value-threshold:10000.00}")
    private BigDecimal highValueThreshold;

    @Value("${app.fraud.suspicious-velocity-count:5}")
    private int suspiciousVelocityCount;

    public FraudAssessment assess(User sender, User receiver, BigDecimal amount) {
        int score = 0;
        StringBuilder reasons = new StringBuilder();

        // 1. Velocity check — count txns in last 1 hour
        long txnLastHour = transactionRepository.countRecentTransactionsByUser(
            sender.getId(), LocalDateTime.now().minusHours(1));

        if (txnLastHour >= maxTxnPerHour) {
            score += 40;
            reasons.append("HIGH_VELOCITY;");
            log.warn("High velocity detected for user {}: {} txns in last hour", sender.getId(), txnLastHour);
        } else if (txnLastHour >= suspiciousVelocityCount) {
            score += 20;
            reasons.append("ELEVATED_VELOCITY;");
        }

        // 2. High-value transaction check
        if (amount.compareTo(highValueThreshold) >= 0) {
            score += 25;
            reasons.append("HIGH_VALUE;");
        }

        // 3. Off-hours check (11 PM – 4 AM IST = suspicious window)
        int hour = LocalDateTime.now().getHour();
        if (hour >= 23 || hour <= 4) {
            score += 10;
            reasons.append("ODD_HOURS;");
        }

        // 4. Rapid repeat transfer to same receiver in last 10 minutes
        long recentToSameReceiver = transactionRepository.countRecentTransactionsByUser(
            sender.getId(), LocalDateTime.now().minusMinutes(10));
        if (recentToSameReceiver >= 3) {
            score += 20;
            reasons.append("RAPID_REPEAT;");
        }

        // Cap at 100
        score = Math.min(score, 100);

        FraudRiskLevel level = scoreToLevel(score);
        boolean shouldFlag = score >= 40;
        boolean shouldBlock = score >= 80;

        log.info("Fraud assessment for user {}: score={}, level={}, reasons={}",
            sender.getId(), score, level, reasons);

        return new FraudAssessment(score, level, shouldFlag, shouldBlock, reasons.toString());
    }

    private FraudRiskLevel scoreToLevel(int score) {
        if (score >= 70) return FraudRiskLevel.CRITICAL;
        if (score >= 40) return FraudRiskLevel.HIGH;
        if (score >= 20) return FraudRiskLevel.MEDIUM;
        return FraudRiskLevel.LOW;
    }

    public record FraudAssessment(
        int score,
        FraudRiskLevel riskLevel,
        boolean shouldFlag,
        boolean shouldBlock,
        String reasons
    ) {}
}
