/* @name find */
WITH 
  mapped_user_id AS (SELECT user_id FROM users WHERE user_uid = :userID OR username = :username)
SELECT 
  post_uid as id,
  slug as slug,
  (select user_uid from users u where u.user_id = p.user_id) as "userID!",
  title,
  summary,
  body,
  visible,
  num_views as "views",
  created_at as "createdAt",
  edited_at as "editedAt"
FROM posts p
WHERE
  (post_uid = :id OR :id IS NULL)
  AND (visible = :visible OR :visible IS NULL)
  AND (slug = :slug OR :slug IS NULL)
  AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :username IS NULL)
  AND (p.user_id = (SELECT user_id FROM mapped_user_id) OR :userID IS NULL)
  AND ((text_search @@ to_tsquery('english', :search || ':*') OR similarity(title, :search) > 0.1)
    OR :search IS NULL
  ) 
  AND (:nextID::TEXT IS NULL OR 
    CASE WHEN :recentFirst 
      THEN (COALESCE(edited_at, created_at) < (
        SELECT COALESCE(edited_at, created_at) FROM posts d WHERE d.post_uid = :nextID)
  ) ELSE (num_views < (SELECT num_views FROM posts p WHERE p.post_uid = :nextID) OR :nextID IS NULL)
    END)
  ORDER BY (CASE WHEN :recentFirst THEN COALESCE(edited_at, created_at) END) DESC,
    num_views DESC
  LIMIT :limit;

/* @name getPK */
SELECT post_id as "pk" from posts WHERE post_uid = :id;

/* @name addView */
UPDATE posts SET num_views = num_views + 1 WHERE post_uid = :id;

/* @name insert */
INSERT INTO posts (
  user_id,
  post_uid,
  slug,
  title,
  summary,
  body
) VALUES (
  (SELECT user_id FROM users where user_uid = :userID!),
  :postID!,
  :slug,
  :title!,
  :summary,
  :body!
);

/* @name update */
UPDATE posts
SET
  slug = COALESCE(:slug, slug),
  title = COALESCE(:title, title),
  summary = COALESCE(:summary, summary),
  body = COALESCE(:body, body),
  visible = COALESCE(:visible, visible)
WHERE post_uid = :id;

/* 
  @name remove
  @param ids -> (...)
*/
DELETE FROM posts WHERE post_uid IN :ids;
