/* @name createSession */
INSERT INTO login_sessions (
    session_id,
    user_uid,
    session_platform,
    session_browser,
    expires_at
  )
VALUES (
    :id!,
    :userID!,
    :platform!,
    :browser!,
    :expiryDate!
  );

/* @name getSession */
SELECT user_uid,
  expires_at
FROM login_sessions
WHERE session_id = :sessionID!;

/* @name findUserSessions */
SELECT session_id,
  created_at,
  expires_at,
  session_platform,
  session_browser
FROM login_sessions
WHERE user_uid = :userID!;

/* @name deleteExpiredSessions */
DELETE FROM login_sessions
WHERE expires_at < :date!;

/* @name deleteSession */
DELETE FROM login_sessions
WHERE session_id = :sessionID!;

/* @name deleteUserSessions */
DELETE FROM login_sessions
WHERE user_uid = :userID!;
