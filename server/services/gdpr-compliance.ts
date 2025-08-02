import { pool } from '../db';
import { getEnv } from '../config/env-validation';
import { logger } from '../config/logger';

/**
 * GDPR Compliance Service for Conversion Tracking
 * Handles consent management, data anonymization, and user rights
 */

export interface ConsentData {
  sessionId: string;
  userId?: string;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  personalizationConsent: boolean;
  consentVersion: string;
  ipAddress?: string;
  userAgent: string;
  consentMethod: 'explicit' | 'implicit' | 'essential';
}

export interface DataExportRequest {
  userId: string;
  email: string;
  requestType: 'export' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
}

export interface PrivacyMetrics {
  totalConsents: number;
  explicitConsents: number;
  withdrawnConsents: number;
  dataExportRequests: number;
  dataDeletionRequests: number;
  anonymizedRecords: number;
}

export class GDPRComplianceService {
  private readonly env = getEnv();

  /**
   * Record user consent for analytics tracking
   */
  public async recordConsent(consentData: ConsentData): Promise<void> {
    try {
      const query = `
        INSERT INTO user_consent (
          session_id, user_id, analytics_consent, marketing_consent, 
          personalization_consent, consent_version, ip_address, 
          user_agent, consent_method, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (session_id) 
        DO UPDATE SET 
          analytics_consent = EXCLUDED.analytics_consent,
          marketing_consent = EXCLUDED.marketing_consent,
          personalization_consent = EXCLUDED.personalization_consent,
          consent_version = EXCLUDED.consent_version,
          consent_method = EXCLUDED.consent_method,
          updated_at = NOW()
      `;

      const values = [
        consentData.sessionId,
        consentData.userId || null,
        consentData.analyticsConsent,
        consentData.marketingConsent,
        consentData.personalizationConsent,
        consentData.consentVersion,
        this.env.ANONYMIZE_IPS ? this.anonymizeIP(consentData.ipAddress) : consentData.ipAddress,
        consentData.userAgent,
        consentData.consentMethod
      ];

      await pool.query(query, values);
      
      logger.info('User consent recorded', {
        sessionId: consentData.sessionId,
        userId: consentData.userId,
        analyticsConsent: consentData.analyticsConsent,
        consentMethod: consentData.consentMethod
      });

    } catch (error) {
      logger.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Check if user has given consent for analytics
   */
  public async hasAnalyticsConsent(sessionId: string, userId?: string): Promise<boolean> {
    try {
      const query = `
        SELECT analytics_consent 
        FROM user_consent 
        WHERE session_id = $1 OR user_id = $2
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await pool.query(query, [sessionId, userId || null]);
      return result.rows.length > 0 ? result.rows[0].analytics_consent : false;

    } catch (error) {
      logger.error('Error checking analytics consent:', error);
      return false; // Fail safe - no consent by default
    }
  }

  /**
   * Withdraw user consent
   */
  public async withdrawConsent(sessionId: string, userId?: string): Promise<void> {
    try {
      const query = `
        UPDATE user_consent 
        SET 
          analytics_consent = false,
          marketing_consent = false,
          personalization_consent = false,
          withdrawn_at = NOW(),
          updated_at = NOW()
        WHERE session_id = $1 OR user_id = $2
      `;

      await pool.query(query, [sessionId, userId || null]);
      
      // Also mark future analytics events as non-consented
      if (userId) {
        await pool.query(
          'UPDATE analytics_events SET user_consent = false WHERE user_id = $1',
          [userId]
        );
      }

      logger.info('User consent withdrawn', { sessionId, userId });

    } catch (error) {
      logger.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Export all user data (GDPR Article 20 - Right to Data Portability)
   */
  public async exportUserData(userId: string): Promise<any> {
    try {
      const userDataQueries = {
        // User profile data
        profile: `SELECT * FROM users WHERE id = $1`,
        
        // Analytics events
        analytics: `
          SELECT event_type, event_data, device_info, page_info, created_at
          FROM analytics_events 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `,
        
        // Hook generations
        hooks: `
          SELECT platform, objective, topic, model_type, hooks, created_at
          FROM hook_generations 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `,
        
        // Favorite hooks
        favorites: `
          SELECT hook_data, framework, platform_notes, topic, platform, created_at
          FROM favorite_hooks 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `,
        
        // A/B test participation
        abTests: `
          SELECT atp.test_id, atp.variant_id, atp.exposure_time, atp.converted, 
                 atp.conversion_time, at.test_name
          FROM ab_test_participants atp
          JOIN ab_tests at ON atp.test_id = at.id
          WHERE atp.user_id = $1
          ORDER BY atp.exposure_time DESC
        `,
        
        // Consent history
        consents: `
          SELECT analytics_consent, marketing_consent, personalization_consent,
                 consent_version, consent_method, created_at, withdrawn_at
          FROM user_consent 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `
      };

      const exportData: any = {
        exportedAt: new Date().toISOString(),
        userId,
        data: {}
      };

      for (const [key, query] of Object.entries(userDataQueries)) {
        try {
          const result = await pool.query(query, [userId]);
          exportData.data[key] = result.rows;
        } catch (error) {
          logger.warn(`Error exporting ${key} data:`, error);
          exportData.data[key] = [];
        }
      }

      logger.info('User data exported', { userId, recordCount: Object.keys(exportData.data).length });
      return exportData;

    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (GDPR Article 17 - Right to Erasure)
   */
  public async deleteUserData(userId: string, keepMinimalData: boolean = false): Promise<void> {
    try {
      await pool.query('BEGIN');

      if (keepMinimalData) {
        // Anonymize instead of delete (for statistical purposes)
        await this.anonymizeUserData(userId);
      } else {
        // Complete deletion
        const deleteQueries = [
          'DELETE FROM analytics_events WHERE user_id = $1',
          'DELETE FROM ab_test_participants WHERE user_id = $1',
          'DELETE FROM funnel_events WHERE user_id = $1',
          'DELETE FROM user_consent WHERE user_id = $1',
          'DELETE FROM favorite_hooks WHERE user_id = $1',
          'DELETE FROM hook_generations WHERE user_id = $1',
          'DELETE FROM user_recent_hooks WHERE user_id = $1',
          'DELETE FROM users WHERE id = $1'
        ];

        for (const query of deleteQueries) {
          await pool.query(query, [userId]);
        }
      }

      await pool.query('COMMIT');
      
      logger.info('User data deleted', { userId, keepMinimalData });

    } catch (error) {
      await pool.query('ROLLBACK');
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Anonymize user data while preserving statistical value
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      const anonymizeQueries = [
        // Anonymize user profile
        `UPDATE users SET 
          email = 'anonymized@example.com',
          first_name = 'Anonymized',
          last_name = 'User',
          profile_image_url = NULL,
          company = NULL,
          firebase_uid = NULL,
          stripe_customer_id = NULL
         WHERE id = $1`,
        
        // Remove user association from analytics events but keep aggregate data
        'UPDATE analytics_events SET user_id = NULL WHERE user_id = $1',
        
        // Remove user association from A/B tests
        'UPDATE ab_test_participants SET user_id = NULL WHERE user_id = $1',
        
        // Remove user association from funnel events
        'UPDATE funnel_events SET user_id = NULL WHERE user_id = $1',
        
        // Anonymize consent records
        `UPDATE user_consent SET 
          user_id = NULL,
          ip_address = NULL,
          user_agent = 'anonymized'
         WHERE user_id = $1`
      ];

      for (const query of anonymizeQueries) {
        await pool.query(query, [userId]);
      }

    } catch (error) {
      logger.error('Error anonymizing user data:', error);
      throw error;
    }
  }

  /**
   * Anonymize IP address for privacy compliance
   */
  private anonymizeIP(ipAddress?: string): string | null {
    if (!ipAddress) return null;

    // IPv4 anonymization - remove last octet
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // IPv6 anonymization - remove last 64 bits
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + '::';
      }
    }

    return ipAddress;
  }

  /**
   * Clean up old data based on retention policy
   */
  public async cleanupOldData(): Promise<void> {
    if (!this.env.GDPR_COMPLIANCE_ENABLED) {
      return;
    }

    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.env.DATA_RETENTION_DAYS);

      const cleanupQueries = [
        // Clean up old analytics events
        'DELETE FROM analytics_events WHERE created_at < $1 AND user_consent = false',
        
        // Clean up old consent records (keep explicit withdrawals)
        'DELETE FROM user_consent WHERE created_at < $1 AND withdrawn_at IS NOT NULL',
        
        // Clean up completed A/B tests older than retention period
        `DELETE FROM ab_test_participants 
         WHERE created_at < $1 
         AND test_id IN (SELECT id FROM ab_tests WHERE status = 'completed')`,
        
        // Clean up old funnel events
        'DELETE FROM funnel_events WHERE created_at < $1'
      ];

      let totalCleaned = 0;
      for (const query of cleanupQueries) {
        const result = await pool.query(query, [retentionDate]);
        totalCleaned += result.rowCount || 0;
      }

      logger.info('Old data cleaned up', { 
        retentionDate: retentionDate.toISOString(),
        recordsCleaned: totalCleaned 
      });

    } catch (error) {
      logger.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  /**
   * Get privacy compliance metrics
   */
  public async getPrivacyMetrics(): Promise<PrivacyMetrics> {
    try {
      const queries = {
        totalConsents: 'SELECT COUNT(*) FROM user_consent',
        explicitConsents: "SELECT COUNT(*) FROM user_consent WHERE consent_method = 'explicit'",
        withdrawnConsents: 'SELECT COUNT(*) FROM user_consent WHERE withdrawn_at IS NOT NULL',
        anonymizedRecords: 'SELECT COUNT(*) FROM analytics_events WHERE user_id IS NULL'
      };

      const metrics: Partial<PrivacyMetrics> = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query);
        metrics[key as keyof PrivacyMetrics] = parseInt(result.rows[0].count);
      }

      return {
        totalConsents: metrics.totalConsents || 0,
        explicitConsents: metrics.explicitConsents || 0,
        withdrawnConsents: metrics.withdrawnConsents || 0,
        dataExportRequests: 0, // TODO: Implement export request tracking
        dataDeletionRequests: 0, // TODO: Implement deletion request tracking
        anonymizedRecords: metrics.anonymizedRecords || 0
      };

    } catch (error) {
      logger.error('Error getting privacy metrics:', error);
      throw error;
    }
  }

  /**
   * Validate analytics event before storing (consent check)
   */
  public async validateAnalyticsEvent(sessionId: string, userId?: string): Promise<boolean> {
    if (!this.env.GDPR_COMPLIANCE_ENABLED) {
      return true; // GDPR not enabled, allow all events
    }

    return this.hasAnalyticsConsent(sessionId, userId);
  }

  /**
   * Initialize cleanup schedule
   */
  public startDataRetentionSchedule(): void {
    if (!this.env.GDPR_COMPLIANCE_ENABLED) {
      return;
    }

    // Run cleanup daily at 2 AM
    const interval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        logger.error('Scheduled data cleanup failed:', error);
      }
    }, interval);

    logger.info('Data retention schedule started');
  }
}

// Singleton instance
export const gdprCompliance = new GDPRComplianceService();