package com.upi.payment.config;

import com.upi.payment.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final WalletRepository walletRepository;

    /**
     * Reset daily spending limits for all wallets at midnight IST.
     * Cron: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    @Transactional
    public void resetDailySpentLimits() {
        int updated = walletRepository.resetDailySpentForAllWallets();
        log.info("Daily limit reset complete. Wallets updated: {}", updated);
    }
}
