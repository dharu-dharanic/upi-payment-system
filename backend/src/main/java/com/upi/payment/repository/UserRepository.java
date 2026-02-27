package com.upi.payment.repository;

import com.upi.payment.entity.User;
import com.upi.payment.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByUpiId(String upiId);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUpiId(String upiId);

    Page<User> findAllByStatus(AccountStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.phoneNumber = :identifier OR u.upiId = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

   @Modifying
@Transactional
@Query("UPDATE User u SET u.failedLoginAttempts = u.failedLoginAttempts + 1 WHERE u.id = :userId")
void incrementFailedLoginAttempts(@Param("userId") Long userId);

@Modifying
@Transactional
@Query("UPDATE User u SET u.failedLoginAttempts = 0 WHERE u.id = :userId")
void resetFailedLoginAttempts(@Param("userId") Long userId);

@Modifying
@Transactional
@Query("UPDATE User u SET u.status = :status WHERE u.id = :userId")
void updateStatus(@Param("userId") Long userId, @Param("status") AccountStatus status);
}
