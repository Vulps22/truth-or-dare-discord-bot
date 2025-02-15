CREATE OR REPLACE VIEW global_leaderboard_user_position AS
SELECT 
    u.id, 
    u.username,
    -- Count how many dares the user has done in the last 30 days
    (
      SELECT COUNT(*) 
      FROM user_questions ud 
      WHERE ud.userId = u.id
        AND ud.type = 'dare'
        AND ud.doneCount >= 1
        AND ud.datetime_created >= NOW() - INTERVAL 30 DAY
    ) AS dares_done,
    -- Count how many truths the user has done in the last 30 days
    (
      SELECT COUNT(*) 
      FROM user_questions ut 
      WHERE ut.userId = u.id
        AND ut.type = 'truth'
        AND ut.doneCount >= 1
        AND ut.datetime_created >= NOW() - INTERVAL 30 DAY
    ) AS truths_done,
    u.globalLevel,
    u.globalLevelXp,
    -- Calculate the user's position (rank) among all users
    (
      SELECT COUNT(*) 
      FROM users u2 
      WHERE 
        u2.globalLevel > u.globalLevel
        OR (
          u2.globalLevel = u.globalLevel 
          AND u2.globalLevelXp > u.globalLevelXp
        )
    ) + 1 AS position
FROM users u;
