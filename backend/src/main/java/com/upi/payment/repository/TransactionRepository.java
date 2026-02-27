package com.upi.payment.repository;

import com.upi.payment.entity.Transaction;
import com.upi.payment.enums.TransactionStatus;
import com.upi.payment.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByReferenceId(String referenceId);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    Page<Transaction> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(
        Long senderId, Long receiverId, Pageable pageable);

    Page<Transaction> findBySenderId(Long senderId, Pageable pageable);

    Page<Transaction> findByReceiverId(Long receiverId, Pageable pageable);

    Page<Transaction> findByStatus(TransactionStatus status, Pageable pageable);

    Page<Transaction> findByIsFlaggedTrue(Pageable pageable);

    // Count transactions in a time window — for fraud/rate-limit checks
    @Query("""
        SELECT COUNT(t) FROM Transaction t
        WHERE t.sender.id = :userId
        AND t.createdAt >= :since
        AND t.status != 'FAILED'
        """)
    long countRecentTransactionsByUser(@Param("userId") Long userId,
                                       @Param("since") LocalDateTime since);

    // Sum of amounts sent today — for daily limit enforcement
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
        WHERE t.sender.id = :userId
        AND t.type = 'TRANSFER'
        AND t.status = 'SUCCESS'
        AND t.createdAt >= :dayStart
        """)
    BigDecimal sumDailyTransferAmount(@Param("userId") Long userId,
                                      @Param("dayStart") LocalDateTime dayStart);

    // Flagged transactions for admin dashboard
    @Query("SELECT t FROM Transaction t WHERE t.isFlagged = true ORDER BY t.createdAt DESC")
    List<Transaction> findAllFlaggedTransactions(Pageable pageable);

    // Transactions between two specific users
    @Query("""
        SELECT t FROM Transaction t
        WHERE (t.sender.id = :user1 AND t.receiver.id = :user2)
           OR (t.sender.id = :user2 AND t.receiver.id = :user1)
        ORDER BY t.createdAt DESC
        """)
    Page<Transaction> findTransactionsBetweenUsers(@Param("user1") Long user1,
                                                    @Param("user2") Long user2,
                                                    Pageable pageable);

    // Admin analytics: total volume by type in a date range
    @Query("""
        SELECT t.type, COUNT(t), SUM(t.amount) FROM Transaction t
        WHERE t.status = 'SUCCESS'
        AND t.createdAt BETWEEN :from AND :to
        GROUP BY t.type
        """)
    List<Object[]> getTransactionSummaryByType(@Param("from") LocalDateTime from,
                                                @Param("to") LocalDateTime to);

    @Query("""
        SELECT t FROM Transaction t
        WHERE t.sender.id = :userId
        AND t.createdAt >= :since
        AND t.type = :type
        """)
    List<Transaction> findRecentByUserAndType(@Param("userId") Long userId,
                                               @Param("since") LocalDateTime since,
                                               @Param("type") TransactionType type);
}
