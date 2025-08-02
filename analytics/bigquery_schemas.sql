-- BigQuery Schema Definitions for HookLine Studio Analytics
-- Create dataset and tables for comprehensive analytics tracking

-- Create main analytics dataset
CREATE SCHEMA IF NOT EXISTS `hookline_analytics`
OPTIONS(
  description="Comprehensive analytics data for HookLine Studio landing page optimization",
  location="US"
);

-- 1. Page Views and Sessions Table
CREATE OR REPLACE TABLE `hookline_analytics.page_views` (
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  page_url STRING NOT NULL,
  page_title STRING,
  referrer STRING,
  utm_source STRING,
  utm_medium STRING,
  utm_campaign STRING,
  utm_content STRING,
  utm_term STRING,
  user_agent STRING,
  device_type STRING,
  browser STRING,
  operating_system STRING,
  screen_resolution STRING,
  viewport_size STRING,
  language STRING,
  timezone STRING,
  country_code STRING,
  region STRING,
  city STRING,
  ip_address STRING,
  timestamp TIMESTAMP NOT NULL,
  load_time_ms INTEGER,
  first_contentful_paint_ms INTEGER,
  largest_contentful_paint_ms INTEGER,
  cumulative_layout_shift FLOAT64,
  first_input_delay_ms INTEGER
)
PARTITION BY DATE(timestamp)
CLUSTER BY device_type, utm_source;

-- 2. Conversion Events Table
CREATE OR REPLACE TABLE `hookline_analytics.conversion_events` (
  event_id STRING NOT NULL,
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  event_type STRING NOT NULL,
  event_name STRING NOT NULL,
  funnel_step STRING,
  conversion_value NUMERIC,
  currency STRING DEFAULT 'USD',
  properties JSON,
  timestamp TIMESTAMP NOT NULL,
  time_since_page_load_ms INTEGER,
  page_url STRING,
  referrer STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, funnel_step;

-- 3. A/B Test Events Table
CREATE OR REPLACE TABLE `hookline_analytics.ab_test_events` (
  test_id STRING NOT NULL,
  variant STRING NOT NULL,
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  event_type STRING NOT NULL, -- 'assigned', 'conversion', 'goal'
  goal_type STRING,
  goal_value NUMERIC,
  timestamp TIMESTAMP NOT NULL,
  properties JSON
)
PARTITION BY DATE(timestamp)
CLUSTER BY test_id, variant;

-- 4. Behavioral Tracking Table
CREATE OR REPLACE TABLE `hookline_analytics.behavioral_events` (
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  event_type STRING NOT NULL, -- 'scroll', 'click', 'form_interaction', 'engagement'
  element_selector STRING,
  element_text STRING,
  interaction_details JSON,
  scroll_depth_percent INTEGER,
  time_on_page_ms INTEGER,
  timestamp TIMESTAMP NOT NULL,
  page_url STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, session_id;

-- 5. Performance Metrics Table
CREATE OR REPLACE TABLE `hookline_analytics.performance_metrics` (
  session_id STRING NOT NULL,
  page_url STRING NOT NULL,
  metric_type STRING NOT NULL, -- 'core_web_vitals', 'navigation_timing', 'resource_timing'
  metric_name STRING NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit STRING,
  rating STRING, -- 'good', 'needs-improvement', 'poor'
  timestamp TIMESTAMP NOT NULL,
  user_agent STRING,
  device_type STRING,
  connection_type STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY metric_type, device_type;

-- 6. User Segments Table
CREATE OR REPLACE TABLE `hookline_analytics.user_segments` (
  user_id STRING,
  anonymous_id STRING NOT NULL,
  traffic_source_category STRING,
  traffic_source_subcategory STRING,
  creator_persona_type STRING,
  creator_persona_platform STRING,
  device_category STRING,
  geographic_region STRING,
  timezone STRING,
  language STRING,
  lead_score INTEGER,
  conversion_probability FLOAT64,
  predicted_ltv NUMERIC,
  churn_risk_score INTEGER,
  segment_assigned_at TIMESTAMP NOT NULL,
  last_updated TIMESTAMP NOT NULL
)
PARTITION BY DATE(segment_assigned_at)
CLUSTER BY creator_persona_type, traffic_source_category;

-- 7. Form Interactions Table
CREATE OR REPLACE TABLE `hookline_analytics.form_interactions` (
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  form_id STRING NOT NULL,
  field_name STRING NOT NULL,
  interaction_type STRING NOT NULL, -- 'focus', 'blur', 'input', 'submit', 'abandon'
  field_value_length INTEGER,
  has_value BOOLEAN,
  time_spent_ms INTEGER,
  timestamp TIMESTAMP NOT NULL,
  page_url STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY form_id, interaction_type;

-- 8. Revenue and Subscription Events
CREATE OR REPLACE TABLE `hookline_analytics.revenue_events` (
  transaction_id STRING NOT NULL,
  user_id STRING NOT NULL,
  session_id STRING,
  event_type STRING NOT NULL, -- 'trial_start', 'subscription', 'upgrade', 'cancel', 'churn'
  plan_name STRING,
  plan_type STRING, -- 'monthly', 'annual'
  amount NUMERIC,
  currency STRING DEFAULT 'USD',
  payment_method STRING,
  coupon_code STRING,
  attribution_source STRING,
  attribution_medium STRING,
  attribution_campaign STRING,
  trial_started_at TIMESTAMP,
  subscription_started_at TIMESTAMP,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, plan_type;

-- 9. Real-time Dashboard Metrics (Materialized View)
CREATE OR REPLACE MATERIALIZED VIEW `hookline_analytics.real_time_metrics`
PARTITION BY DATE(metric_date)
CLUSTER BY metric_type
AS
SELECT
  DATE(timestamp) as metric_date,
  'conversion_rate' as metric_type,
  COUNT(DISTINCT CASE WHEN ce.event_type = 'conversion' THEN ce.session_id END) / 
    COUNT(DISTINCT pv.session_id) * 100 as metric_value,
  MAX(timestamp) as last_updated
FROM `hookline_analytics.page_views` pv
LEFT JOIN `hookline_analytics.conversion_events` ce 
  ON pv.session_id = ce.session_id
WHERE DATE(pv.timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp)

UNION ALL

SELECT
  DATE(timestamp) as metric_date,
  'avg_session_duration' as metric_type,
  AVG(time_on_page_ms) / 1000 as metric_value,
  MAX(timestamp) as last_updated
FROM `hookline_analytics.behavioral_events`
WHERE event_type = 'session_summary'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp);

-- 10. Error Tracking Table
CREATE OR REPLACE TABLE `hookline_analytics.error_events` (
  error_id STRING NOT NULL,
  session_id STRING NOT NULL,
  user_id STRING,
  anonymous_id STRING NOT NULL,
  error_type STRING NOT NULL, -- 'javascript', 'network', 'performance'
  error_message STRING,
  error_stack STRING,
  filename STRING,
  line_number INTEGER,
  column_number INTEGER,
  user_agent STRING,
  page_url STRING,
  timestamp TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY error_type;

-- Create indexes for better query performance
CREATE SEARCH INDEX page_views_search_index
ON `hookline_analytics.page_views`(ALL COLUMNS);

CREATE SEARCH INDEX conversion_events_search_index
ON `hookline_analytics.conversion_events`(ALL COLUMNS);

-- Set up row-level security (if needed for privacy compliance)
-- This would restrict access based on user roles and data sensitivity

-- Create views for common analytics queries
CREATE OR REPLACE VIEW `hookline_analytics.conversion_funnel_view` AS
SELECT
  pv.session_id,
  pv.user_id,
  pv.anonymous_id,
  pv.utm_source,
  pv.utm_medium,
  pv.device_type,
  pv.timestamp as session_start,
  ce_trial.timestamp as trial_signup_time,
  ce_paid.timestamp as paid_conversion_time,
  TIMESTAMP_DIFF(ce_trial.timestamp, pv.timestamp, SECOND) as time_to_trial_seconds,
  TIMESTAMP_DIFF(ce_paid.timestamp, ce_trial.timestamp, SECOND) as trial_to_paid_seconds,
  CASE 
    WHEN ce_trial.timestamp IS NOT NULL THEN 'trial_signup'
    WHEN ce_paid.timestamp IS NOT NULL THEN 'paid_conversion'
    ELSE 'visitor'
  END as conversion_stage
FROM `hookline_analytics.page_views` pv
LEFT JOIN `hookline_analytics.conversion_events` ce_trial
  ON pv.session_id = ce_trial.session_id 
  AND ce_trial.event_name = 'trial_signup'
LEFT JOIN `hookline_analytics.conversion_events` ce_paid
  ON pv.session_id = ce_paid.session_id 
  AND ce_paid.event_name = 'paid_conversion'
WHERE DATE(pv.timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);

CREATE OR REPLACE VIEW `hookline_analytics.ab_test_results_view` AS
WITH test_assignments AS (
  SELECT 
    test_id,
    variant,
    COUNT(DISTINCT session_id) as total_visitors,
    COUNT(DISTINCT CASE WHEN event_type = 'conversion' THEN session_id END) as conversions
  FROM `hookline_analytics.ab_test_events`
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY test_id, variant
),
test_stats AS (
  SELECT
    test_id,
    variant,
    total_visitors,
    conversions,
    conversions / total_visitors as conversion_rate,
    LAG(conversions / total_visitors) OVER (PARTITION BY test_id ORDER BY variant) as control_rate
  FROM test_assignments
)
SELECT
  test_id,
  variant,
  total_visitors,
  conversions,
  conversion_rate,
  CASE 
    WHEN control_rate IS NOT NULL 
    THEN (conversion_rate - control_rate) / control_rate * 100
    ELSE 0
  END as lift_percentage,
  CASE
    WHEN total_visitors >= 1000 AND conversions >= 20 THEN 'sufficient'
    WHEN total_visitors >= 500 AND conversions >= 10 THEN 'moderate'
    ELSE 'insufficient'
  END as statistical_power
FROM test_stats
ORDER BY test_id, variant;