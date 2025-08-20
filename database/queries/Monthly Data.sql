SELECT
  stats.year_week,
  stats.week_start,
  stats.active_users,
  stats.total_questions,

  COALESCE(new_users.count, 0) AS new_users,
  COALESCE(new_servers.count, 0) AS new_servers

FROM (
  SELECT
    YEARWEEK(uq.datetime_created, 1) AS year_week,
    MIN(DATE(uq.datetime_created)) AS week_start,
    COUNT(DISTINCT uq.userId) AS active_users,
    COUNT(*) AS total_questions
  FROM tord.user_questions uq
  WHERE uq.datetime_created >= NOW() - INTERVAL 6 MONTH
    AND YEARWEEK(uq.datetime_created, 1) > 202507
    AND YEARWEEK(uq.datetime_created, 1) < YEARWEEK(NOW(), 1)  -- exclude current week
  GROUP BY YEARWEEK(uq.datetime_created, 1)
) AS stats

LEFT JOIN (
  SELECT
    YEARWEEK(created_datetime, 1) AS year_week,
    COUNT(*) AS count
  FROM tord.users
  GROUP BY YEARWEEK(created_datetime, 1)
) AS new_users ON new_users.year_week = stats.year_week

LEFT JOIN (
  SELECT
    YEARWEEK(date_created, 1) AS year_week,
    COUNT(*) AS count
  FROM tord.servers
  GROUP BY YEARWEEK(date_created, 1)
) AS new_servers ON new_servers.year_week = stats.year_week

ORDER BY stats.year_week;
