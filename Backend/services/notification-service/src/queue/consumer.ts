/**
 * Notification Consumer — Global Event Listener
 * ===============================================
 * Listens to the BullMQ "notifications" queue for events published
 * by other services (discovery, intelligence, osint, etc.).
 *
 * Global Event Types:
 *   THREAT_DETECTED       → from OSINT service
 *   VULNERABILITY_FOUND   → from Intelligence service
 *   SCAN_COMPLETED         → from Discovery service
 *   DATA_BREACH_DETECTED   → from OSINT service
 *   BRAND_EXPOSURE_FOUND  → from OSINT service
 *   OSINT_LEAK_FOUND      → from OSINT service
 */

import { Worker } from 'bullmq';
import { getRedis } from './connection';
import { config } from '../config';
import { Notification, NotificationType, EventType } from '../models/Notification';
import { sendEmail, buildCriticalAlertEmail, buildAlertEmail } from '../services/mailer';
import { pushToTenant } from '../services/gateway-connector';

// ──────────────────────────────────────
//  Event → Notification mapping
// ──────────────────────────────────────

const SEVERITY_MAP: Record<string, NotificationType> = {
  CRITICAL: 'CRITICAL',
  HIGH: 'ALERT',
  MEDIUM: 'WARNING',
  LOW: 'INFO',
};

function getDetailsUrl(eventType: string, sourceId: string | undefined): string {
  const base = 'http://localhost:3000/dashboard';
  switch (eventType) {
    case 'VULNERABILITY_FOUND': return `${base}/intelligence/vulnerabilities/${sourceId || ''}`;
    case 'DATA_BREACH_DETECTED':
    case 'OSINT_LEAK_FOUND': return `${base}/osint/leaks/${sourceId || ''}`;
    case 'BRAND_EXPOSURE_FOUND': return `${base}/osint/exposures/${sourceId || ''}`;
    case 'SCAN_COMPLETED': return `${base}/discovery/scans/${sourceId || ''}`;
    case 'THREAT_DETECTED': return `${base}/intelligence/threats/${sourceId || ''}`;
    default: return base;
  }
}

// ──────────────────────────────────────
//  Event types expected from other services
// ──────────────────────────────────────

export interface NotificationEvent {
  type: EventType;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceService: string;
  sourceId?: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────
//  Consumer Worker
// ──────────────────────────────────────

export function createConsumer(): Worker {
  const worker = new Worker<NotificationEvent>(
    'notifications',
    async (job) => {
      const { type, title, message, severity, sourceService, sourceId, tenantId, metadata } = job.data;
      const notificationType = SEVERITY_MAP[severity] || 'INFO';
      const detailsUrl = getDetailsUrl(type, sourceId);

      console.log(`[Notify] Processing: ${type} (${severity}) — ${title}`);

      // ── Step 1: Save to MongoDB ──
      const notification = await Notification.create({
        title,
        message,
        type: notificationType,
        eventType: type,
        source: sourceService,
        sourceId: sourceId || null,
        read: false,
        tenantId,
        metadata: metadata || {},
      });

      // ── Step 2: Push via Socket.io to tenant ──
      pushToTenant(tenantId, {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        eventType: notification.eventType,
        source: notification.source,
        createdAt: notification.createdAt,
      });

      // ── Step 3: Send email if severity is high enough ──
      const thresholdLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf('HIGH');
      const eventLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].indexOf(severity);

      if (eventLevel >= thresholdLevel && config.nodeEnv !== 'test') {
        let emailSent = false;

        if (severity === 'CRITICAL') {
          const emailPayload = buildCriticalAlertEmail(title, message, detailsUrl);
          emailSent = await sendEmail(emailPayload);
        } else {
          const emailPayload = buildAlertEmail(title, message, detailsUrl, severity);
          emailSent = await sendEmail(emailPayload);
        }

        if (emailSent) {
          await Notification.findByIdAndUpdate(notification._id, {
            emailSent: true,
            emailSentAt: new Date(),
          });
        }
      }

      console.log(`[Notify] ✓ ${type} — notification ${notification._id}`);

      return { notificationId: notification._id.toString(), emailSent: notification.emailSent };
    },
    {
      connection: getRedis(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Notify] ✗ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
