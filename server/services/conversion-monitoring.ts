import { pool } from '../db';
import { getEnv } from '../config/env-validation';
import { logger } from '../config/logger';

/**
 * Conversion metrics monitoring and alerting service
 * Tracks key conversion metrics and triggers alerts when thresholds are exceeded
 */

export interface ConversionMetrics {
  totalEvents: number;
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  errorRate: number;
  performanceP95: number;
  activeABTests: number;
  topPerformingVariants: VariantMetrics[];
  alertsTriggered: Alert[];
}

export interface VariantMetrics {
  variantId: string;
  testId: string;
  conversionRate: number;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

export interface Alert {
  id: string;
  type: 'performance' | 'conversion' | 'error' | 'ab_test';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

export class ConversionMonitoringService {
  private alerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly env = getEnv();

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start the monitoring service
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already running
    }

    const interval = this.env.ENABLE_PERFORMANCE_MONITORING ? 60000 : 300000; // 1 or 5 minutes
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectAndAnalyzeMetrics();
      } catch (error) {
        logger.error('Monitoring service error:', error);
      }
    }, interval);

    logger.info('Conversion monitoring service started');
  }

  /**
   * Stop the monitoring service
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Conversion monitoring service stopped');
    }
  }

  /**
   * Collect and analyze conversion metrics
   */
  private async collectAndAnalyzeMetrics(): Promise<void> {
    const metrics = await this.getConversionMetrics();
    
    // Check thresholds and trigger alerts
    await this.checkPerformanceThresholds(metrics);
    await this.checkConversionThresholds(metrics);
    await this.checkErrorThresholds(metrics);
    await this.checkABTestSignificance(metrics);
    
    // Log metrics for monitoring
    logger.info('Conversion metrics collected', {
      conversionRate: `${metrics.conversionRate.toFixed(2)}%`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`,
      performanceP95: `${metrics.performanceP95}ms`,
      activeABTests: metrics.activeABTests
    });
  }

  /**
   * Get current conversion metrics from database
   */
  public async getConversionMetrics(): Promise<ConversionMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      // Get basic analytics metrics
      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(CASE WHEN event_type = 'cta_click' THEN 1 END) as cta_clicks,
          COUNT(CASE WHEN event_type = 'cta_view' THEN 1 END) as cta_views,
          COUNT(CASE WHEN event_type = 'error' THEN 1 END) as errors,
          AVG(CASE 
            WHEN event_data->>'responseTime' IS NOT NULL 
            THEN (event_data->>'responseTime')::int 
          END) as avg_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (
            ORDER BY (event_data->>'responseTime')::int
          ) as p95_response_time
        FROM analytics_events 
        WHERE created_at >= $1
      `;

      const analyticsResult = await pool.query(analyticsQuery, [oneHourAgo]);
      const analytics = analyticsResult.rows[0];

      // Calculate conversion rate
      const conversionRate = analytics.cta_views > 0 
        ? (analytics.cta_clicks / analytics.cta_views) * 100 
        : 0;

      // Calculate error rate
      const errorRate = analytics.total_events > 0
        ? (analytics.errors / analytics.total_events) * 100
        : 0;

      // Get A/B test metrics
      const abTestQuery = `
        SELECT 
          COUNT(DISTINCT test_id) as active_tests,
          test_id,
          variant_id,
          COUNT(*) as participants,
          COUNT(CASE WHEN converted = true THEN 1 END) as conversions
        FROM ab_test_participants atp
        JOIN ab_tests at ON atp.test_id = at.id
        WHERE at.status = 'running' 
        AND atp.created_at >= $1
        GROUP BY test_id, variant_id
      `;

      const abTestResult = await pool.query(abTestQuery, [oneHourAgo]);
      const activeABTests = abTestResult.rows.length > 0 
        ? abTestResult.rows[0].active_tests || 0 
        : 0;

      // Calculate variant metrics
      const topPerformingVariants = this.calculateVariantMetrics(abTestResult.rows);

      return {
        totalEvents: parseInt(analytics.total_events),
        conversionRate,
        averageSessionDuration: 0, // TODO: Calculate from session data
        bounceRate: 0, // TODO: Calculate from session data
        errorRate,
        performanceP95: parseInt(analytics.p95_response_time) || 0,
        activeABTests,
        topPerformingVariants,
        alertsTriggered: this.alerts.filter(alert => !alert.resolved)
      };

    } catch (error) {
      logger.error('Error collecting conversion metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate variant performance metrics
   */
  private calculateVariantMetrics(variantData: any[]): VariantMetrics[] {
    return variantData.map(variant => {
      const conversionRate = variant.participants > 0 
        ? (variant.conversions / variant.participants) * 100 
        : 0;
      
      const sampleSize = parseInt(variant.participants);
      const confidence = this.calculateStatisticalConfidence(
        variant.conversions, 
        variant.participants
      );
      
      return {
        variantId: variant.variant_id,
        testId: variant.test_id,
        conversionRate,
        sampleSize,
        confidence,
        isSignificant: confidence >= 95 && sampleSize >= this.env.AB_TESTING_MIN_SAMPLE_SIZE
      };
    });
  }

  /**
   * Calculate statistical confidence for A/B test results
   */
  private calculateStatisticalConfidence(conversions: number, participants: number): number {
    if (participants < 10) return 0;
    
    const conversionRate = conversions / participants;
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / participants);
    const zScore = Math.abs(conversionRate - 0.1) / standardError; // Comparing to 10% baseline
    
    // Simplified confidence calculation
    if (zScore > 2.576) return 99;
    if (zScore > 1.96) return 95;
    if (zScore > 1.645) return 90;
    return Math.round(zScore * 45); // Rough approximation
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private async checkPerformanceThresholds(metrics: ConversionMetrics): Promise<void> {
    const threshold = this.env.PERFORMANCE_THRESHOLD_P95;
    
    if (metrics.performanceP95 > threshold) {
      await this.triggerAlert({
        type: 'performance',
        severity: metrics.performanceP95 > threshold * 2 ? 'critical' : 'high',
        message: `Performance degraded: P95 response time is ${metrics.performanceP95}ms`,
        threshold,
        currentValue: metrics.performanceP95
      });
    }
  }

  /**
   * Check conversion rate thresholds
   */
  private async checkConversionThresholds(metrics: ConversionMetrics): Promise<void> {
    const baselineConversionRate = 5; // 5% baseline
    const threshold = baselineConversionRate * 0.5; // Alert if below 2.5%
    
    if (metrics.conversionRate < threshold && metrics.totalEvents > 100) {
      await this.triggerAlert({
        type: 'conversion',
        severity: 'high',
        message: `Conversion rate dropped to ${metrics.conversionRate.toFixed(2)}%`,
        threshold,
        currentValue: metrics.conversionRate
      });
    }
  }

  /**
   * Check error rate thresholds
   */
  private async checkErrorThresholds(metrics: ConversionMetrics): Promise<void> {
    const threshold = this.env.ERROR_RATE_THRESHOLD * 100; // Convert to percentage
    
    if (metrics.errorRate > threshold) {
      await this.triggerAlert({
        type: 'error',
        severity: metrics.errorRate > threshold * 2 ? 'critical' : 'high',
        message: `Error rate elevated: ${metrics.errorRate.toFixed(2)}%`,
        threshold,
        currentValue: metrics.errorRate
      });
    }
  }

  /**
   * Check A/B test significance
   */
  private async checkABTestSignificance(metrics: ConversionMetrics): Promise<void> {
    for (const variant of metrics.topPerformingVariants) {
      if (variant.isSignificant && variant.sampleSize >= this.env.AB_TESTING_MIN_SAMPLE_SIZE) {
        await this.triggerAlert({
          type: 'ab_test',
          severity: 'medium',
          message: `A/B test ${variant.testId} variant ${variant.variantId} reached significance`,
          threshold: 95,
          currentValue: variant.confidence
        });
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      !a.resolved && 
      a.type === alert.type && 
      a.message === alert.message
    );

    if (existingAlert) {
      logger.debug('Similar alert already exists, skipping', { alertType: alert.type });
      return;
    }

    this.alerts.push(alert);
    
    // Log the alert
    logger.warn('Conversion alert triggered', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      threshold: alert.threshold,
      currentValue: alert.currentValue
    });

    // In production, you could integrate with external alerting services
    if (this.env.NODE_ENV === 'production') {
      await this.sendExternalAlert(alert);
    }
  }

  /**
   * Send alert to external services (Slack, email, etc.)
   */
  private async sendExternalAlert(alert: Alert): Promise<void> {
    // TODO: Integrate with external alerting services
    // Examples: Slack webhooks, email notifications, PagerDuty, etc.
    
    logger.info('External alert would be sent', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity
    });
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert resolved', { alertId });
    }
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get conversion metrics for API endpoint
   */
  public async getMetricsForAPI(): Promise<ConversionMetrics> {
    return this.getConversionMetrics();
  }

  /**
   * Clean up old resolved alerts
   */
  private cleanupOldAlerts(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > oneDayAgo
    );
  }
}

// Singleton instance
export const conversionMonitoring = new ConversionMonitoringService();