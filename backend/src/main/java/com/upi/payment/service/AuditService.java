package com.upi.payment.service;

public interface AuditService {
    void log(Long userId, String action, String details, String entityType, Long entityId, String ipAddress, boolean success);
}
