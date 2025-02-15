CREATE OR REPLACE VIEW server_leaderboard_top10 AS
WITH RankedUsers AS (
    SELECT 
        su.server_id,
        su.user_id AS id,
        u.username,
        su.server_level AS globalLevel,
        su.server_level_xp AS globalLevelXp,
        ROW_NUMBER() OVER (
            PARTITION BY su.server_id
            ORDER BY su.server_level DESC, su.server_level_xp DESC
        ) AS position
    FROM server_users su
    JOIN users u ON u.id = su.user_id
),
QuestionCounts AS (
    SELECT 
        uq.userId,
        uq.serverId,
        SUM(
            CASE 
                WHEN uq.type = 'dare'
                     AND uq.doneCount >= 2  -- Hard-coded threshold
                THEN 1 
                ELSE 0 
            END
        ) AS dares_done,
        SUM(
            CASE 
                WHEN uq.type = 'truth'
                     AND uq.doneCount >= 2  -- Hard-coded threshold
                THEN 1 
                ELSE 0 
            END
        ) AS truths_done
    FROM user_questions uq
    WHERE uq.datetime_created >= NOW() - INTERVAL 90 DAY
    GROUP BY uq.userId, uq.serverId
)

-- Main query pulls all the previusly calculated data together
SELECT 
    ru.server_id,
    ru.id,
    ru.username,
    COALESCE(qc.dares_done, 0) AS dares_done,
    COALESCE(qc.truths_done, 0) AS truths_done,
    ru.globalLevel,
    ru.globalLevelXp,
    ru.position
FROM RankedUsers ru
LEFT JOIN QuestionCounts qc 
    ON ru.id = qc.userId AND ru.server_id = qc.serverId
WHERE ru.position <= 10
ORDER BY ru.position;
