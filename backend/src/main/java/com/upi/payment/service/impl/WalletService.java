package com.upi.payment.service.impl;

import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.entity.Wallet;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;

    @Cacheable(value = "walletBalance", key = "#userId")
    @Transactional(readOnly = true)
    public ApiResponse.WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new BusinessException("Wallet not found"));

        BigDecimal availableToday = wallet.getDailyLimit().subtract(wallet.getDailySpent());

        return ApiResponse.WalletResponse.builder()
            .id(wallet.getId())
            .balance(wallet.getBalance())
            .dailySpent(wallet.getDailySpent())
            .dailyLimit(wallet.getDailyLimit())
            .availableToday(availableToday.max(BigDecimal.ZERO))
            .build();
    }

    @CacheEvict(value = "walletBalance", key = "#userId")
    public void evictCache(Long userId) {
        // Cache eviction on balance change
    }
}
