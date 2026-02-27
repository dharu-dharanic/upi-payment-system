package com.upi.payment.service.impl;

import com.upi.payment.entity.AuditLog;
import com.upi.payment.repository.AuditLogRepository;
import com.upi.payment.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Runs in a new transaction so audit log is always saved,
     * even if the main transaction rolls back.
     * Async to not block the main request thread.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public void log(Long userId, String action, String details, String entityType,
                    Long entityId, String ipAddress, boolean success) {
        try {
            AuditLog log = AuditLog.builder()
                .userId(userId)
                .action(action)
                .details(details)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .isSuccess(success)
                .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to save audit log for action {}: {}", action, e.getMessage());
        }
    }
}
