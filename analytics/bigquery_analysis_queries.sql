-- Comprehensive BigQuery Analysis Queries for HookLine Studio
-- These queries provide actionable insights for conversion optimization

-- ===================================================================
-- 1. CONVERSION FUNNEL ANALYSIS
-- ===================================================================

-- Overall Conversion Funnel with Drop-off Analysis
WITH funnel_data AS (
  SELECT 
    pv.session_id,
    pv.utm_source,
    pv.utm_medium,
    pv.device_type,
    us.creator_persona_type,
    us.traffic_source_category,
    pv.timestamp as landing_time,
    
    -- Funnel stages
    MIN(CASE WHEN ce.event_name = 'trial_signup' THEN ce.timestamp END) as trial_time,
    MIN(CASE WHEN re.event_type = 'subscription' THEN re.timestamp END) as subscription_time,
    
    -- Performance metrics
    AVG(pm.metric_value) as avg_load_time,
    MAX(be.scroll_depth_percent) as max_scroll_depth
    
  FROM `hookline_analytics.page_views` pv
  LEFT JOIN `hookline_analytics.conversion_events` ce ON pv.session_id = ce.session_id
  LEFT JOIN `hookline_analytics.revenue_events` re ON pv.session_id = re.session_id
  LEFT JOIN `hookline_analytics.user_segments` us ON pv.anonymous_id = us.anonymous_id
  LEFT JOIN `hookline_analytics.performance_metrics` pm 
    ON pv.session_id = pm.session_id AND pm.metric_name = 'page_load_time'
  LEFT JOIN `hookline_analytics.behavioral_events` be 
    ON pv.session_id = be.session_id AND be.event_type = 'scroll'
  
  WHERE DATE(pv.timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY 1,2,3,4,5,6,7
)

SELECT
  -- Segmentation
  COALESCE(utm_source, 'direct') as traffic_source,
  device_type,
  creator_persona_type,
  
  -- Funnel metrics
  COUNT(*) as total_visitors,
  COUNT(trial_time) as trial_signups,
  COUNT(subscription_time) as paid_conversions,
  
  -- Conversion rates
  ROUND(COUNT(trial_time) / COUNT(*) * 100, 2) as visitor_to_trial_rate,
  ROUND(COUNT(subscription_time) / COUNT(trial_time) * 100, 2) as trial_to_paid_rate,
  ROUND(COUNT(subscription_time) / COUNT(*) * 100, 2) as overall_conversion_rate,
  
  -- Performance correlation
  ROUND(AVG(CASE WHEN trial_time IS NOT NULL THEN avg_load_time END), 0) as avg_load_time_converters,
  ROUND(AVG(CASE WHEN trial_time IS NULL THEN avg_load_time END), 0) as avg_load_time_non_converters,
  
  -- Engagement correlation
  ROUND(AVG(CASE WHEN trial_time IS NOT NULL THEN max_scroll_depth END), 1) as avg_scroll_converters,
  ROUND(AVG(CASE WHEN trial_time IS NULL THEN max_scroll_depth END), 1) as avg_scroll_non_converters,
  
  -- Time to conversion
  ROUND(AVG(TIMESTAMP_DIFF(trial_time, landing_time, SECOND)) / 60, 1) as avg_minutes_to_trial,
  ROUND(AVG(TIMESTAMP_DIFF(subscription_time, trial_time, HOUR)), 1) as avg_hours_trial_to_paid

FROM funnel_data
GROUP BY 1,2,3
HAVING total_visitors >= 50  -- Statistical significance threshold
ORDER BY overall_conversion_rate DESC;

-- ===================================================================
-- 2. A/B TEST PERFORMANCE ANALYSIS
-- ===================================================================

-- Statistical Analysis of A/B Tests with Confidence Intervals
WITH test_metrics AS (
  SELECT 
    test_id,
    variant,
    COUNT(DISTINCT session_id) as visitors,
    COUNT(DISTINCT CASE 
      WHEN event_type = 'conversion' AND goal_type = 'trial_signup' 
      THEN session_id 
    END) as trial_conversions,
    COUNT(DISTINCT CASE 
      WHEN event_type = 'conversion' AND goal_type = 'paid_conversion' 
      THEN session_id 
    END) as paid_conversions,
    SUM(CASE WHEN goal_type = 'revenue' THEN goal_value ELSE 0 END) as total_revenue
  FROM `hookline_analytics.ab_test_events`
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY 1,2
),

test_stats AS (
  SELECT 
    test_id,
    variant,
    visitors,
    trial_conversions,
    paid_conversions,
    total_revenue,
    
    -- Conversion rates
    trial_conversions / visitors as trial_rate,
    paid_conversions / visitors as paid_rate,
    total_revenue / visitors as revenue_per_visitor,
    
    -- Get control variant metrics for comparison
    FIRST_VALUE(trial_conversions / visitors) OVER (
      PARTITION BY test_id 
      ORDER BY CASE WHEN variant = 'control' THEN 0 ELSE 1 END
    ) as control_trial_rate,
    FIRST_VALUE(paid_conversions / visitors) OVER (
      PARTITION BY test_id 
      ORDER BY CASE WHEN variant = 'control' THEN 0 ELSE 1 END
    ) as control_paid_rate,
    FIRST_VALUE(total_revenue / visitors) OVER (
      PARTITION BY test_id 
      ORDER BY CASE WHEN variant = 'control' THEN 0 ELSE 1 END
    ) as control_revenue_per_visitor
    
  FROM test_metrics
)

SELECT
  test_id,
  variant,
  visitors,
  trial_conversions,
  paid_conversions,
  ROUND(trial_rate * 100, 2) as trial_conversion_rate_pct,
  ROUND(paid_rate * 100, 2) as paid_conversion_rate_pct,
  ROUND(revenue_per_visitor, 2) as revenue_per_visitor,
  
  -- Statistical significance (simplified z-test)
  CASE 
    WHEN variant != 'control' THEN
      ROUND((trial_rate - control_trial_rate) / control_trial_rate * 100, 2)
    ELSE 0
  END as trial_rate_lift_pct,
  
  CASE 
    WHEN variant != 'control' THEN
      ROUND((paid_rate - control_paid_rate) / control_paid_rate * 100, 2)
    ELSE 0
  END as paid_rate_lift_pct,
  
  CASE 
    WHEN variant != 'control' THEN
      ROUND((revenue_per_visitor - control_revenue_per_visitor) / control_revenue_per_visitor * 100, 2)
    ELSE 0
  END as revenue_lift_pct,
  
  -- Statistical power assessment
  CASE
    WHEN visitors >= 1000 AND trial_conversions >= 30 THEN 'High'
    WHEN visitors >= 500 AND trial_conversions >= 15 THEN 'Medium'
    WHEN visitors >= 100 AND trial_conversions >= 5 THEN 'Low'
    ELSE 'Insufficient'
  END as statistical_power,
  
  -- Confidence level (simplified)
  CASE
    WHEN visitors >= 1000 AND ABS(trial_rate - control_trial_rate) > 0.02 THEN '95%+'
    WHEN visitors >= 500 AND ABS(trial_rate - control_trial_rate) > 0.03 THEN '90%+'
    WHEN visitors >= 200 AND ABS(trial_rate - control_trial_rate) > 0.05 THEN '80%+'
    ELSE '<80%'
  END as confidence_level

FROM test_stats
ORDER BY test_id, CASE WHEN variant = 'control' THEN 0 ELSE 1 END, variant;

-- ===================================================================
-- 3. CUSTOMER SEGMENTATION PERFORMANCE ANALYSIS
-- ===================================================================

-- Creator Persona Performance Analysis
WITH persona_performance AS (
  SELECT 
    us.creator_persona_type,
    us.traffic_source_category,
    COUNT(DISTINCT pv.session_id) as total_sessions,
    COUNT(DISTINCT ce.session_id) as trial_signups,
    COUNT(DISTINCT re.user_id) as paid_conversions,
    SUM(re.amount) as total_revenue,
    
    -- Behavioral metrics
    AVG(be.scroll_depth_percent) as avg_scroll_depth,
    AVG(be.time_on_page_ms) / 1000 as avg_time_on_page_seconds,
    COUNT(DISTINCT CASE WHEN fi.interaction_type = 'submit' THEN fi.session_id END) as form_submissions,
    
    -- Performance correlation
    AVG(pm.metric_value) as avg_page_load_time,
    
    -- Predictive metrics
    AVG(us.lead_score) as avg_lead_score,
    AVG(us.conversion_probability) as avg_conversion_probability,
    AVG(us.predicted_ltv) as avg_predicted_ltv

  FROM `hookline_analytics.user_segments` us
  LEFT JOIN `hookline_analytics.page_views` pv ON us.anonymous_id = pv.anonymous_id
  LEFT JOIN `hookline_analytics.conversion_events` ce 
    ON pv.session_id = ce.session_id AND ce.event_name = 'trial_signup'
  LEFT JOIN `hookline_analytics.revenue_events` re ON us.user_id = re.user_id
  LEFT JOIN `hookline_analytics.behavioral_events` be 
    ON pv.session_id = be.session_id AND be.event_type = 'scroll'
  LEFT JOIN `hookline_analytics.form_interactions` fi ON pv.session_id = fi.session_id
  LEFT JOIN `hookline_analytics.performance_metrics` pm 
    ON pv.session_id = pm.session_id AND pm.metric_name = 'page_load_time'
    
  WHERE DATE(us.segment_assigned_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY 1,2
)

SELECT
  creator_persona_type,
  traffic_source_category,
  total_sessions,
  trial_signups,
  paid_conversions,
  ROUND(total_revenue, 2) as total_revenue,
  
  -- Conversion metrics
  ROUND(trial_signups / total_sessions * 100, 2) as trial_conversion_rate_pct,
  ROUND(paid_conversions / trial_signups * 100, 2) as trial_to_paid_rate_pct,
  ROUND(total_revenue / total_sessions, 2) as revenue_per_session,
  ROUND(total_revenue / paid_conversions, 2) as avg_customer_value,
  
  -- Engagement metrics
  ROUND(avg_scroll_depth, 1) as avg_scroll_depth_pct,
  ROUND(avg_time_on_page_seconds, 1) as avg_time_on_page_sec,
  ROUND(form_submissions / total_sessions * 100, 2) as form_submission_rate_pct,
  
  -- Performance impact
  ROUND(avg_page_load_time, 0) as avg_page_load_ms,
  
  -- Predictive insights
  ROUND(avg_lead_score, 1) as avg_lead_score,
  ROUND(avg_conversion_probability * 100, 1) as avg_conversion_probability_pct,
  ROUND(avg_predicted_ltv, 2) as avg_predicted_ltv

FROM persona_performance
WHERE total_sessions >= 20  -- Minimum threshold for reliability
ORDER BY revenue_per_session DESC;

-- ===================================================================
-- 4. PERFORMANCE IMPACT ON CONVERSIONS
-- ===================================================================

-- Core Web Vitals Impact Analysis
WITH performance_buckets AS (
  SELECT 
    pm.session_id,
    
    -- Core Web Vitals buckets
    CASE 
      WHEN pm.metric_name = 'largest_contentful_paint' AND pm.metric_value <= 2500 THEN 'Good'
      WHEN pm.metric_name = 'largest_contentful_paint' AND pm.metric_value <= 4000 THEN 'Needs Improvement'
      WHEN pm.metric_name = 'largest_contentful_paint' THEN 'Poor'
    END as lcp_rating,
    
    CASE 
      WHEN pm.metric_name = 'first_input_delay' AND pm.metric_value <= 100 THEN 'Good'
      WHEN pm.metric_name = 'first_input_delay' AND pm.metric_value <= 300 THEN 'Needs Improvement'
      WHEN pm.metric_name = 'first_input_delay' THEN 'Poor'
    END as fid_rating,
    
    CASE 
      WHEN pm.metric_name = 'cumulative_layout_shift' AND pm.metric_value <= 0.1 THEN 'Good'
      WHEN pm.metric_name = 'cumulative_layout_shift' AND pm.metric_value <= 0.25 THEN 'Needs Improvement'
      WHEN pm.metric_name = 'cumulative_layout_shift' THEN 'Poor'
    END as cls_rating,
    
    -- Page load time buckets
    CASE 
      WHEN pm.metric_name = 'page_load_time' AND pm.metric_value <= 2000 THEN 'Fast'
      WHEN pm.metric_name = 'page_load_time' AND pm.metric_value <= 4000 THEN 'Average'
      WHEN pm.metric_name = 'page_load_time' THEN 'Slow'
    END as load_time_bucket,
    
    pv.device_type,
    CASE WHEN ce.session_id IS NOT NULL THEN 1 ELSE 0 END as converted,
    CASE WHEN re.user_id IS NOT NULL THEN re.amount ELSE 0 END as revenue
    
  FROM `hookline_analytics.performance_metrics` pm
  JOIN `hookline_analytics.page_views` pv ON pm.session_id = pv.session_id
  LEFT JOIN `hookline_analytics.conversion_events` ce 
    ON pm.session_id = ce.session_id AND ce.event_name = 'trial_signup'
  LEFT JOIN `hookline_analytics.revenue_events` re 
    ON pv.user_id = re.user_id AND re.event_type = 'subscription'
    
  WHERE DATE(pm.timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND pm.metric_name IN ('largest_contentful_paint', 'first_input_delay', 'cumulative_layout_shift', 'page_load_time')
)

SELECT
  COALESCE(load_time_bucket, 'Unknown') as performance_bucket,
  device_type,
  COUNT(*) as total_sessions,
  SUM(converted) as conversions,
  SUM(revenue) as total_revenue,
  
  -- Conversion metrics by performance
  ROUND(SUM(converted) / COUNT(*) * 100, 2) as conversion_rate_pct,
  ROUND(SUM(revenue) / COUNT(*), 2) as revenue_per_session,
  
  -- Performance distribution
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER() * 100, 1) as session_share_pct,
  ROUND(SUM(converted) / SUM(SUM(converted)) OVER() * 100, 1) as conversion_share_pct,
  
  -- Core Web Vitals impact
  AVG(CASE WHEN lcp_rating = 'Good' THEN converted END) * 100 as good_lcp_conversion_rate,
  AVG(CASE WHEN lcp_rating = 'Poor' THEN converted END) * 100 as poor_lcp_conversion_rate

FROM performance_buckets
WHERE load_time_bucket IS NOT NULL
GROUP BY 1,2
ORDER BY conversion_rate_pct DESC;

-- ===================================================================
-- 5. BEHAVIORAL PATTERN ANALYSIS
-- ===================================================================

-- User Journey and Engagement Analysis
WITH user_journeys AS (
  SELECT 
    be.session_id,
    pv.utm_source,
    pv.device_type,
    us.creator_persona_type,
    
    -- Engagement metrics
    MAX(be.scroll_depth_percent) as max_scroll_depth,
    COUNT(CASE WHEN be.event_type = 'click' THEN 1 END) as total_clicks,
    MAX(be.time_on_page_ms) / 1000 as time_on_page_seconds,
    
    -- Form interactions
    COUNT(DISTINCT CASE WHEN fi.interaction_type = 'focus' THEN fi.field_name END) as fields_interacted,
    SUM(CASE WHEN fi.interaction_type = 'submit' THEN 1 ELSE 0 END) as form_submissions,
    
    -- Conversion outcome
    CASE WHEN ce.session_id IS NOT NULL THEN 1 ELSE 0 END as converted,
    CASE WHEN re.user_id IS NOT NULL THEN re.amount ELSE 0 END as revenue
    
  FROM `hookline_analytics.behavioral_events` be
  JOIN `hookline_analytics.page_views` pv ON be.session_id = pv.session_id
  LEFT JOIN `hookline_analytics.user_segments` us ON pv.anonymous_id = us.anonymous_id
  LEFT JOIN `hookline_analytics.form_interactions` fi ON be.session_id = fi.session_id
  LEFT JOIN `hookline_analytics.conversion_events` ce 
    ON be.session_id = ce.session_id AND ce.event_name = 'trial_signup'
  LEFT JOIN `hookline_analytics.revenue_events` re 
    ON pv.user_id = re.user_id AND re.event_type = 'subscription'
    
  WHERE DATE(be.timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY 1,2,3,4
),

engagement_segments AS (
  SELECT 
    *,
    CASE 
      WHEN max_scroll_depth >= 80 AND total_clicks >= 3 AND time_on_page_seconds >= 120 THEN 'High Engagement'
      WHEN max_scroll_depth >= 50 AND total_clicks >= 1 AND time_on_page_seconds >= 60 THEN 'Medium Engagement'
      WHEN max_scroll_depth >= 25 OR total_clicks >= 1 OR time_on_page_seconds >= 30 THEN 'Low Engagement'
      ELSE 'Bounce'
    END as engagement_level
  FROM user_journeys
)

SELECT
  engagement_level,
  creator_persona_type,
  device_type,
  COUNT(*) as total_sessions,
  SUM(converted) as conversions,
  SUM(revenue) as total_revenue,
  
  -- Conversion rates by engagement
  ROUND(SUM(converted) / COUNT(*) * 100, 2) as conversion_rate_pct,
  ROUND(SUM(revenue) / COUNT(*), 2) as revenue_per_session,
  
  -- Average engagement metrics
  ROUND(AVG(max_scroll_depth), 1) as avg_scroll_depth,
  ROUND(AVG(total_clicks), 1) as avg_clicks,
  ROUND(AVG(time_on_page_seconds), 1) as avg_time_on_page,
  ROUND(AVG(fields_interacted), 1) as avg_form_fields_touched,
  ROUND(SUM(form_submissions) / COUNT(*) * 100, 2) as form_submission_rate_pct

FROM engagement_segments
GROUP BY 1,2,3
ORDER BY conversion_rate_pct DESC;

-- ===================================================================
-- 6. REAL-TIME MONITORING QUERIES
-- ===================================================================

-- Current Hour Performance Dashboard
SELECT
  EXTRACT(HOUR FROM timestamp) as hour,
  COUNT(DISTINCT session_id) as visitors,
  COUNT(DISTINCT CASE WHEN ce.event_name = 'trial_signup' THEN ce.session_id END) as trial_signups,
  COUNT(DISTINCT CASE WHEN re.event_type = 'subscription' THEN re.user_id END) as paid_conversions,
  SUM(CASE WHEN re.event_type = 'subscription' THEN re.amount ELSE 0 END) as revenue,
  
  -- Real-time conversion rates
  ROUND(COUNT(DISTINCT CASE WHEN ce.event_name = 'trial_signup' THEN ce.session_id END) / 
        COUNT(DISTINCT pv.session_id) * 100, 2) as trial_conversion_rate,
  
  -- Performance metrics
  AVG(CASE WHEN pm.metric_name = 'page_load_time' THEN pm.metric_value END) as avg_load_time_ms,
  COUNT(CASE WHEN ee.error_type IS NOT NULL THEN 1 END) as error_count

FROM `hookline_analytics.page_views` pv
LEFT JOIN `hookline_analytics.conversion_events` ce ON pv.session_id = ce.session_id
LEFT JOIN `hookline_analytics.revenue_events` re ON pv.user_id = re.user_id
LEFT JOIN `hookline_analytics.performance_metrics` pm ON pv.session_id = pm.session_id
LEFT JOIN `hookline_analytics.error_events` ee ON pv.session_id = ee.session_id

WHERE DATE(pv.timestamp) = CURRENT_DATE()
GROUP BY 1
ORDER BY 1 DESC
LIMIT 24;

-- Traffic Source Performance Today
SELECT
  COALESCE(utm_source, 'direct') as traffic_source,
  COUNT(DISTINCT session_id) as visitors,
  COUNT(DISTINCT CASE WHEN ce.event_name = 'trial_signup' THEN ce.session_id END) as conversions,
  ROUND(COUNT(DISTINCT CASE WHEN ce.event_name = 'trial_signup' THEN ce.session_id END) / 
        COUNT(DISTINCT pv.session_id) * 100, 2) as conversion_rate_pct,
  SUM(CASE WHEN re.event_type = 'subscription' THEN re.amount ELSE 0 END) as revenue

FROM `hookline_analytics.page_views` pv
LEFT JOIN `hookline_analytics.conversion_events` ce ON pv.session_id = ce.session_id
LEFT JOIN `hookline_analytics.revenue_events` re ON pv.user_id = re.user_id

WHERE DATE(pv.timestamp) = CURRENT_DATE()
GROUP BY 1
ORDER BY visitors DESC;