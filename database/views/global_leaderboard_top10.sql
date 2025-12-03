CREATE OR REPLACE VIEW global_leaderboard_top10 AS
WITH RankedUsers AS (
    SELECT 
        u.id,
        u.username,
        u.globalLevel,
        u.globalLevelXp,
        ROW_NUMBER() OVER (ORDER BY u.globalLevel DESC, u.globalLevelXp DESC) AS position
    FROM users u
),
QuestionCounts AS (
    SELECT 
        uq.userId,
        SUM(
            CASE 
                WHEN uq.type = 'dare'  
                     AND uq.doneCount >= 2  -- Hard-coded threshold (e.g., 1)
                THEN 1 
                ELSE 0 
            END
        ) AS dares_done,
        SUM(
            CASE 
                WHEN uq.type = 'truth' 
                     AND uq.doneCount >= 2  -- Hard-coded threshold (e.g., 1)
                THEN 1 
                ELSE 0 
            END
        ) AS truths_done
    FROM user_questions uq
    WHERE uq.datetime_created >= NOW() - INTERVAL 30 DAY
    GROUP BY uq.userId
)
SELECT 
    ru.id,
    ru.username,
    COALESCE(qc.dares_done, 0) AS dares_done,
    COALESCE(qc.truths_done, 0) AS truths_done,
    ru.globalLevel,
    ru.globalLevelXp,
    ru.position
FROM RankedUsers ru
LEFT JOIN QuestionCounts qc ON ru.id = qc.userId
WHERE ru.position <= 10
ORDER BY ru.position;
