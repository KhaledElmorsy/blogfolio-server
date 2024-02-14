/* @name find */
WITH 
  user_id AS (SELECT user_id FROM users WHERE user_uid = :userId)
SELECT 
  post_uid as id,
  post_slug as slug,
  (select user_uid from users u where u.user_id = p.user_id) as "author",
  title,
  summary,
  body,
  num_views as "views",
  created_at as "createdAt",
  edited_at as "editedAt"
FROM posts p
WHERE
  (post_uid = :id OR :id IS NULL)
  AND (visible = :visible OR :visible IS NULL)
  AND (p.user_id = user_id OR :userId IS NULL)
  AND (p.user_id = :user__id or :user__id IS NULL)
  AND (created_at < :createdBefore OR :createdBefore IS NULL)
  AND (created_at > :createdAter OR :createdAter IS NULL);

/* @name getId */
SELECT post_id as "__id" from posts WHERE post_uid = :id;

/* @name insert */
INSERT INTO posts (
  user_id,
  post_uid,
  post_slug,
  title,
  summary,
  body
) VALUES (
  :userId!,
  :postId!,
  :slug,
  :title!,
  :summary,
  :body!
);

/* @name update */
UPDATE posts
SET
  post_slug = COALESCE(:slug, post_slug),
  title = COALESCE(:title, title),
  summary = COALESCE(:summary, summary),
  body = COALESCE(:body, body),
  visible = COALESCE(:visible, visible)
WHERE post_id = :id;

/* 
  @name drop 
  @param __ids -> (...)
*/
DELETE FROM posts WHERE post_id IN :__ids;
