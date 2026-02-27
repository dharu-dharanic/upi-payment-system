package com.upi.payment.enums;

public enum TransactionType {
    DEPOSIT,       // Bank -> Wallet
    WITHDRAWAL,    // Wallet -> Bank
    TRANSFER,      // Wallet -> Wallet (P2P)
    REFUND
}
