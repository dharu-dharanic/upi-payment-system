package com.upi.payment.service.impl;

import com.upi.payment.dto.request.TransactionRequest;
import com.upi.payment.dto.response.ApiResponse;
import com.upi.payment.entity.BankAccount;
import com.upi.payment.entity.Transaction;
import com.upi.payment.entity.User;
import com.upi.payment.entity.Wallet;
import com.upi.payment.enums.TransactionStatus;
import com.upi.payment.enums.TransactionType;
import com.upi.payment.exception.BusinessException;
import com.upi.payment.exception.DuplicateTransactionException;
import com.upi.payment.exception.InsufficientBalanceException;
import com.upi.payment.repository.BankAccountRepository;
import com.upi.payment.repository.TransactionRepository;
import com.upi.payment.repository.UserRepository;
import com.upi.payment.repository.WalletRepository;
import com.upi.payment.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BankAccountRepository bankAccountRepository;
    private final FraudDetectionService fraudDetectionService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Peer-to-peer transfer.
     * Uses SERIALIZABLE isolation + pessimistic wallet locks to prevent:
     *  - Race conditions
     *  - Double spending
     *  - Partial updates
     *
     * Idempotency key ensures safe client retries without duplicate payments.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE, rollbackFor = Exception.class)
    public ApiResponse.TransactionResponse transfer(Long senderId, TransactionRequest.Transfer request, String ipAddress) {

        // ── Idempotency check ──────────────────────────────────────────────────
        transactionRepository.findByIdempotencyKey(request.getIdempotencyKey())
            .ifPresent(existing -> {
                throw new DuplicateTransactionException(
                    "Duplicate transaction. Original ref: " + existing.getReferenceId());
            });

        // ── Load sender ────────────────────────────────────────────────────────
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new BusinessException("Sender not found"));

        // ── Verify UPI PIN ─────────────────────────────────────────────────────
        if (sender.getUpiPin() == null) {
            throw new BusinessException("UPI PIN not set. Please set your UPI PIN first.");
        }
        if (!passwordEncoder.matches(request.getUpiPin(), sender.getUpiPin())) {
            throw new BusinessException("Incorrect UPI PIN");
        }

        // ── Load receiver ──────────────────────────────────────────────────────
        User receiver = userRepository.findByIdentifier(request.getReceiverIdentifier())
            .orElseThrow(() -> new BusinessException("Receiver not found: " + request.getReceiverIdentifier()));

        if (sender.getId().equals(receiver.getId())) {
            throw new BusinessException("Cannot transfer to yourself");
        }

        // ── Fraud detection ────────────────────────────────────────────────────
        FraudDetectionService.FraudAssessment fraud =
            fraudDetectionService.assess(sender, receiver, request.getAmount());

        if (fraud.shouldBlock()) {
            // Record blocked attempt
            saveFailedTransaction(sender, receiver, request, ipAddress, fraud,
                "Blocked by fraud detection: " + fraud.reasons());
            auditService.log(senderId, "TRANSACTION_BLOCKED", "Fraud score: " + fraud.score(), "Transaction", null, ipAddress, false);
            throw new BusinessException("Transaction blocked due to suspicious activity. Contact support.");
        }

        // ── Lock both wallets (lower ID first to prevent deadlock) ─────────────
        Long firstId = Math.min(sender.getId(), receiver.getId());
        Long secondId = Math.max(sender.getId(), receiver.getId());

        Wallet firstWallet = walletRepository.findByUserIdWithLock(firstId)
            .orElseThrow(() -> new BusinessException("Wallet not found"));
        Wallet secondWallet = walletRepository.findByUserIdWithLock(secondId)
            .orElseThrow(() -> new BusinessException("Wallet not found"));

        Wallet senderWallet = sender.getId().equals(firstId) ? firstWallet : secondWallet;
        Wallet receiverWallet = receiver.getId().equals(firstId) ? firstWallet : secondWallet;

        // ── Balance checks ─────────────────────────────────────────────────────
        if (!senderWallet.hasSufficientBalance(request.getAmount())) {
            throw new InsufficientBalanceException("Insufficient wallet balance");
        }
        if (senderWallet.isDailyLimitExceeded(request.getAmount())) {
            throw new BusinessException("Daily transfer limit exceeded");
        }

        // ── Snapshot balances for audit ────────────────────────────────────────
        BigDecimal senderBefore = senderWallet.getBalance();
        BigDecimal receiverBefore = receiverWallet.getBalance();

        // ── Perform the atomic debit/credit ───────────────────────────────────
        senderWallet.debit(request.getAmount());
        receiverWallet.credit(request.getAmount());

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // ── Persist transaction record ─────────────────────────────────────────
        Transaction txn = Transaction.builder()
            .referenceId(generateReferenceId())
            .idempotencyKey(request.getIdempotencyKey())
            .sender(sender)
            .receiver(receiver)
            .amount(request.getAmount())
            .type(TransactionType.TRANSFER)
            .status(TransactionStatus.SUCCESS)
            .fraudRiskLevel(fraud.riskLevel())
            .fraudScore(fraud.score())
            .isFlagged(fraud.shouldFlag())
            .description(request.getDescription())
            .senderBalanceBefore(senderBefore)
            .senderBalanceAfter(senderWallet.getBalance())
            .receiverBalanceBefore(receiverBefore)
            .receiverBalanceAfter(receiverWallet.getBalance())
            .processedAt(LocalDateTime.now())
            .ipAddress(ipAddress)
            .build();

        txn = transactionRepository.save(txn);

        auditService.log(senderId, "TRANSFER_SUCCESS",
            String.format("₹%.2f to %s (Ref: %s)", request.getAmount(), receiver.getUpiId(), txn.getReferenceId()),
            "Transaction", txn.getId(), ipAddress, true);

        log.info("Transfer success: {} -> {} | Amount: {} | Ref: {}",
            sender.getUpiId(), receiver.getUpiId(), request.getAmount(), txn.getReferenceId());

        return toResponse(txn, sender, receiver, senderWallet.getBalance());
    }

    /**
     * Add money from bank account to wallet.
     * Also ACID-compliant with pessimistic locks on both bank account and wallet.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public ApiResponse.TransactionResponse addMoney(Long userId, TransactionRequest.AddMoney request, String ipAddress) {

        // Idempotency check
        transactionRepository.findByIdempotencyKey(request.getIdempotencyKey())
            .ifPresent(existing -> {
                throw new DuplicateTransactionException("Duplicate deposit. Ref: " + existing.getReferenceId());
            });

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found"));

        // Lock bank account
        BankAccount bankAccount = bankAccountRepository.findByIdWithLock(request.getBankAccountId())
            .orElseThrow(() -> new BusinessException("Bank account not found"));

        if (!bankAccount.getUser().getId().equals(userId)) {
            throw new BusinessException("Bank account does not belong to this user");
        }
        if (bankAccount.getBankBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException("Insufficient bank balance");
        }

        // Lock wallet
        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
            .orElseThrow(() -> new BusinessException("Wallet not found"));

        BigDecimal walletBefore = wallet.getBalance();

        // Deduct from bank, credit wallet
        bankAccount.setBankBalance(bankAccount.getBankBalance().subtract(request.getAmount()));
        wallet.credit(request.getAmount());

        bankAccountRepository.save(bankAccount);
        walletRepository.save(wallet);

        Transaction txn = Transaction.builder()
            .referenceId(generateReferenceId())
            .idempotencyKey(request.getIdempotencyKey())
            .receiver(user)
            .amount(request.getAmount())
            .type(TransactionType.DEPOSIT)
            .status(TransactionStatus.SUCCESS)
            .description("Add money from " + bankAccount.getBankName())
            .receiverBalanceBefore(walletBefore)
            .receiverBalanceAfter(wallet.getBalance())
            .processedAt(LocalDateTime.now())
            .ipAddress(ipAddress)
            .build();

        txn = transactionRepository.save(txn);

        auditService.log(userId, "DEPOSIT_SUCCESS",
            String.format("₹%.2f added from bank (Ref: %s)", request.getAmount(), txn.getReferenceId()),
            "Transaction", txn.getId(), ipAddress, true);

        return toResponse(txn, null, user, wallet.getBalance());
    }

    @Transactional(readOnly = true)
    public ApiResponse.PageResponse<ApiResponse.TransactionResponse> getHistory(Long userId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found"));

        Page<Transaction> pageResult = transactionRepository
            .findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId, pageable);

        var content = pageResult.getContent().stream()
            .map(t -> toResponse(t, t.getSender(), t.getReceiver(),
                t.getSender() != null && t.getSender().getId().equals(userId)
                    ? t.getSenderBalanceAfter() : t.getReceiverBalanceAfter()))
            .toList();

        return ApiResponse.PageResponse.<ApiResponse.TransactionResponse>builder()
            .content(content)
            .pageNumber(pageResult.getNumber())
            .pageSize(pageResult.getSize())
            .totalElements(pageResult.getTotalElements())
            .totalPages(pageResult.getTotalPages())
            .last(pageResult.isLast())
            .build();
    }

    @Transactional(readOnly = true)
    public ApiResponse.TransactionResponse getByReference(String referenceId, Long requestingUserId) {
        Transaction txn = transactionRepository.findByReferenceId(referenceId)
            .orElseThrow(() -> new BusinessException("Transaction not found"));

        // Ensure the requesting user is part of this transaction
        boolean isSender = txn.getSender() != null && txn.getSender().getId().equals(requestingUserId);
        boolean isReceiver = txn.getReceiver() != null && txn.getReceiver().getId().equals(requestingUserId);
        boolean isAdmin = true; // If needed, check role from context

        if (!isSender && !isReceiver) {
            throw new BusinessException("Access denied to this transaction");
        }

        BigDecimal balanceAfter = isSender ? txn.getSenderBalanceAfter() : txn.getReceiverBalanceAfter();
        return toResponse(txn, txn.getSender(), txn.getReceiver(), balanceAfter);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void saveFailedTransaction(User sender, User receiver, TransactionRequest.Transfer request,
                                       String ipAddress, FraudDetectionService.FraudAssessment fraud, String reason) {
        Transaction txn = Transaction.builder()
            .referenceId(generateReferenceId())
            .idempotencyKey(request.getIdempotencyKey())
            .sender(sender)
            .receiver(receiver)
            .amount(request.getAmount())
            .type(TransactionType.TRANSFER)
            .status(TransactionStatus.FAILED)
            .fraudRiskLevel(fraud.riskLevel())
            .fraudScore(fraud.score())
            .isFlagged(true)
            .failureReason(reason)
            .ipAddress(ipAddress)
            .build();
        transactionRepository.save(txn);
    }

    private ApiResponse.TransactionResponse toResponse(Transaction txn, User sender, User receiver, BigDecimal balanceAfter) {
        return ApiResponse.TransactionResponse.builder()
            .id(txn.getId())
            .referenceId(txn.getReferenceId())
            .senderName(sender != null ? sender.getFullName() : null)
            .senderUpiId(sender != null ? sender.getUpiId() : null)
            .receiverName(receiver != null ? receiver.getFullName() : null)
            .receiverUpiId(receiver != null ? receiver.getUpiId() : null)
            .amount(txn.getAmount())
            .fee(txn.getFee())
            .type(txn.getType())
            .status(txn.getStatus())
            .fraudRiskLevel(txn.getFraudRiskLevel())
            .description(txn.getDescription())
            .failureReason(txn.getFailureReason())
            .balanceAfter(balanceAfter)
            .processedAt(txn.getProcessedAt())
            .createdAt(txn.getCreatedAt())
            .build();
    }

    private String generateReferenceId() {
        return "TXN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
