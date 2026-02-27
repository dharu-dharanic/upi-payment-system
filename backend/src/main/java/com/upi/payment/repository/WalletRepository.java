package com.upi.payment.repository;

import com.upi.payment.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    // Pessimistic WRITE lock — used for concurrent balance update safety
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId")
    Optional<Wallet> findByUserIdWithLock(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Wallet w SET w.dailySpent = 0 WHERE w.dailySpent > 0")
    int resetDailySpentForAllWallets();

    @Query("SELECT w.balance FROM Wallet w WHERE w.user.id = :userId")
    Optional<BigDecimal> getBalanceByUserId(@Param("userId") Long userId);
}
