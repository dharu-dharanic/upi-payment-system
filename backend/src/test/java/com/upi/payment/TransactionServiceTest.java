package com.upi.payment;

import com.upi.payment.dto.request.TransactionRequest;
import com.upi.payment.entity.User;
import com.upi.payment.entity.Wallet;
import com.upi.payment.enums.AccountStatus;
import com.upi.payment.enums.FraudRiskLevel;
import com.upi.payment.enums.TransactionStatus;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.exception.DuplicateTransactionException;
import com.upi.payment.exception.InsufficientBalanceException;
import com.upi.payment.repository.BankAccountRepository;
import com.upi.payment.repository.TransactionRepository;
import com.upi.payment.repository.UserRepository;
import com.upi.payment.repository.WalletRepository;
import com.upi.payment.service.AuditService;
import com.upi.payment.service.impl.FraudDetectionService;
import com.upi.payment.service.impl.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock TransactionRepository transactionRepository;
    @Mock UserRepository userRepository;
    @Mock WalletRepository walletRepository;
    @Mock BankAccountRepository bankAccountRepository;
    @Mock FraudDetectionService fraudDetectionService;
    @Mock AuditService auditService;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks TransactionService transactionService;

    private User sender;
    private User receiver;
    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        sender = User.builder()
            .id(1L).fullName("Alice").email("alice@test.com")
            .phoneNumber("9000000001").upiId("9000000001@upi")
            .upiPin("$2a$12$hashedpin").status(AccountStatus.ACTIVE)
            .build();

        receiver = User.builder()
            .id(2L).fullName("Bob").email("bob@test.com")
            .phoneNumber("9000000002").upiId("9000000002@upi")
            .status(AccountStatus.ACTIVE)
            .build();

        senderWallet = Wallet.builder()
            .id(1L).user(sender)
            .balance(new BigDecimal("5000.00"))
            .dailySpent(BigDecimal.ZERO)
            .dailyLimit(new BigDecimal("100000.00"))
            .build();

        receiverWallet = Wallet.builder()
            .id(2L).user(receiver)
            .balance(new BigDecimal("1000.00"))
            .dailySpent(BigDecimal.ZERO)
            .dailyLimit(new BigDecimal("100000.00"))
            .build();
    }

    @Test
    void transfer_success() {
        // Arrange
        var request = new TransactionRequest.Transfer();
        request.setReceiverIdentifier("9000000002@upi");
        request.setAmount(new BigDecimal("500.00"));
        request.setUpiPin("1234");
        request.setIdempotencyKey("idempotency-key-001");

        when(transactionRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(passwordEncoder.matches("1234", sender.getUpiPin())).thenReturn(true);
        when(userRepository.findByIdentifier("9000000002@upi")).thenReturn(Optional.of(receiver));
        when(fraudDetectionService.assess(any(), any(), any()))
            .thenReturn(new FraudDetectionService.FraudAssessment(0, FraudRiskLevel.LOW, false, false, ""));
        when(walletRepository.findByUserIdWithLock(1L)).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserIdWithLock(2L)).thenReturn(Optional.of(receiverWallet));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        var result = transactionService.transfer(1L, request, "127.0.0.1");

        // Assert
        assertThat(result.getStatus()).isEqualTo(TransactionStatus.SUCCESS);
        assertThat(senderWallet.getBalance()).isEqualByComparingTo("4500.00");
        assertThat(receiverWallet.getBalance()).isEqualByComparingTo("1500.00");
        verify(walletRepository, times(2)).save(any());
    }

    @Test
    void transfer_insufficientBalance_throws() {
        var request = new TransactionRequest.Transfer();
        request.setReceiverIdentifier("9000000002@upi");
        request.setAmount(new BigDecimal("99999.00"));
        request.setUpiPin("1234");
        request.setIdempotencyKey("idempotency-key-002");

        when(transactionRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(passwordEncoder.matches("1234", sender.getUpiPin())).thenReturn(true);
        when(userRepository.findByIdentifier(any())).thenReturn(Optional.of(receiver));
        when(fraudDetectionService.assess(any(), any(), any()))
            .thenReturn(new FraudDetectionService.FraudAssessment(0, FraudRiskLevel.LOW, false, false, ""));
        when(walletRepository.findByUserIdWithLock(1L)).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserIdWithLock(2L)).thenReturn(Optional.of(receiverWallet));

        assertThatThrownBy(() -> transactionService.transfer(1L, request, "127.0.0.1"))
            .isInstanceOf(InsufficientBalanceException.class);
    }

    @Test
    void transfer_duplicateIdempotencyKey_throws() {
        var request = new TransactionRequest.Transfer();
        request.setIdempotencyKey("duplicate-key");

        var existing = com.upi.payment.entity.Transaction.builder()
            .referenceId("TXN123").build();
        when(transactionRepository.findByIdempotencyKey("duplicate-key"))
            .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> transactionService.transfer(1L, request, "127.0.0.1"))
            .isInstanceOf(DuplicateTransactionException.class);
    }

    @Test
    void transfer_selfTransfer_throws() {
        var request = new TransactionRequest.Transfer();
        request.setReceiverIdentifier("alice@test.com");
        request.setAmount(new BigDecimal("100.00"));
        request.setUpiPin("1234");
        request.setIdempotencyKey("key-003");

        when(transactionRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(passwordEncoder.matches("1234", sender.getUpiPin())).thenReturn(true);
        when(userRepository.findByIdentifier("alice@test.com")).thenReturn(Optional.of(sender));

        assertThatThrownBy(() -> transactionService.transfer(1L, request, "127.0.0.1"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("yourself");
    }

    @Test
    void transfer_fraudBlocked_throws() {
        var request = new TransactionRequest.Transfer();
        request.setReceiverIdentifier("9000000002@upi");
        request.setAmount(new BigDecimal("500.00"));
        request.setUpiPin("1234");
        request.setIdempotencyKey("key-004");

        when(transactionRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(passwordEncoder.matches("1234", sender.getUpiPin())).thenReturn(true);
        when(userRepository.findByIdentifier(any())).thenReturn(Optional.of(receiver));
        when(fraudDetectionService.assess(any(), any(), any()))
            .thenReturn(new FraudDetectionService.FraudAssessment(90, FraudRiskLevel.CRITICAL, true, true, "HIGH_VELOCITY;"));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> transactionService.transfer(1L, request, "127.0.0.1"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("blocked");
    }
}
