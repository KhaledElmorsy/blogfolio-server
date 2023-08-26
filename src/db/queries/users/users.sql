/* @name getUsers */
SELECT
  id as "id!",
  username as "username!",
  bio,
  "firstName",
  "lastName",
  "photoSmall",
  "photoFull",
  "followerCount" as "followerCount!",
  "followingCount" as "followingCount!"
FROM
  get_user(
    fields => :fields,
    sort_cols => :sortCols,
    sort_dir => :sortDir,
    q_id => :pk,
    q_uid => :id,
    q_follower_uid => :followerId, 
    q_follows_uid => :followsId,
    q_search_username => :searchUsername,
    q_search_any => :searchAny,
    result_limit => :limit,
    next_uid => :nextId,
    log_query => :logQuery
  ); 

/* 
  @name find 
  @param ids -> (...)
  @param emails -> (...)
  @param usernames -> (...)
*/
SELECT 
  user_uid as "id!",
  email as "email!",
  username as "username!"
FROM users 
WHERE
  user_uid in :ids
  OR email in :emails
  OR username in :usernames;

/* @name getPassword */
SELECT password from users WHERE user_uid = :id;

/* 
  @name getPks
  @param ids -> (...) 
*/
SELECT user_uid as "id!", user_id as "pk!" from users where user_uid in :ids;

/*
  @name getIds
  @param pks -> (...)
*/
SELECT user_uid as "id!", user_id AS "pk!" FROM users WHERE user_id in :pks;

/* @name add */
INSERT INTO users (
  user_uid,
  username,
  password,
  email,
  bio,
  first_name,
  last_name,
  photo_small,
  photo_full
) VALUES (
  :id!,
  :username!,
  :password!,
  :email!,
  :bio,
  :firstName,
  :lastName,
  :photoSmall,
  :photoFull
);

/* @name update */
UPDATE users 
SET 
  username = COALESCE(:username, username),
  password = COALESCE(:password, password), 
  email = COALESCE(:email, email), 
  bio = COALESCE(:bio, bio), 
  first_name = COALESCE(:firstName, first_name), 
  last_name = COALESCE(:lastName, last_name), 
  photo_small = COALESCE(:photoSmall, photo_small), 
  photo_full = COALESCE(:photoFull, photo_full)
WHERE user_uid = :id!;

/* 
  @name drop
  @param pks -> (...) 
  @param ids -> (...) 
*/
DELETE FROM users WHERE user_id in :pks OR user_uid in :ids
RETURNING user_uid as "id!", user_id as "pk!";

/* @name checkFollow */
WITH found_follow as (
  SELECT user_id
  FROM user_follows
  WHERE user_id = (SELECT user_id FROM users where user_uid = :id)
    AND follower_id = (SELECT user_id from users where user_uid = :followerId)
) SELECT (SELECT user_id FROM found_follow) IS NOT NULL as "doesFollow!";

/* @name addFollow */
INSERT INTO user_follows (user_id, follower_id)
VALUES (
  (SELECT user_id FROM users WHERE user_uid = :id!),
  (SELECT user_id FROM users WHERE user_uid = :followerId!)
);


/* @name removeFollow */
DELETE FROM user_follows
WHERE follower_id = (SELECT user_id FROM users WHERE user_uid = :followerId!)
  AND user_id = (SELECT user_id FROM users WHERE user_uid = :id!);

/* @name checkActive */
SELECT active FROM users WHERE user_uid = :id!;

/* @name activate */
UPDATE users 
SET active = true 
WHERE user_uid = :id!;
