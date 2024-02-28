/* @name tree */
WITH RECURSIVE comment_tree(comment_id, parent_comment_id, depth) AS (
	SELECT comment_id, parent_comment_id, 0
	FROM comments c
	WHERE 
		(c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)
	AND (comment_uid = :rootCommentID OR :rootCommentID IS NULL)
	
	UNION ALL

	SELECT c.comment_id, c.parent_comment_id, depth + 1
	FROM comments c
	INNER JOIN comment_tree ct ON ct.comment_id = c.parent_comment_id
	AND (depth < :depth OR :depth IS NULL) 
) SELECT co.comment_uid as "id", co.comment_id as "pk", co.parent_comment_id as "parentPK"
FROM comment_tree ct
INNER JOIN comments co ON ct.comment_id = co.comment_id;

/* @name find */
SELECT 
  comment_uid as id,
	(SELECT user_uid FROM users u WHERE u.user_id = c.user_id) as "userID",
	(SELECT comment_uid FROM comments sc WHERE sc.comment_id = c.parent_comment_id) as "parentID",
	(SELECT post_uid FROM posts p WHERE p.post_id = c.post_id) as "postID!",
  body,
  created_at as "createdAt",
  edited_at as "editedAt",
	COALESCE(count(ce.comment_id),0) as "emotes!"
FROM comments c
LEFT JOIN comment_emotes ce ON c.comment_id = ce.comment_id
WHERE 
   (comment_uid = ANY (:ids) OR :ids is NULL)
  AND (c.user_id = (SELECT user_id FROM users u WHERE u.user_uid = :userID) OR :userID IS NULL)
  AND (c.post_id = (SELECT post_id FROM posts p WHERE p.post_uid = :postID) OR :postID IS NULL)
  AND (c.user_id = (SELECT user_id FROM users u WHERE u.username = :username) OR :username IS NULL)
  AND (c.post_id = (SELECT post_id FROM posts p WHERE p.slug = :slug) OR :slug IS NULL)
	AND ( :nextID::TEXT IS NULL OR 
		CASE WHEN :popular THEN  TRUE ELSE 
	(created_at < (SELECT created_at FROM comments WHERE comment_uid = :nextID) OR :nextID IS NULL)
	END)
GROUP BY c.comment_id, id, "userID", "parentID", "postID!", body, "createdAt", "editedAt"
HAVING (count(ce.comment_id) < (
	SELECT count(ce.comment_id) FROM comment_emotes ce WHERE comment_id = (
		SELECT comment_id FROM comments WHERE comment_uid = :nextID 
	)
)) OR ((:popular IS NULL OR :nextID IS NULL) AND NOT (:popular IS NOT NULL AND :nextID IS NOT NULL))
ORDER BY CASE WHEN :popular THEN (SELECT count(ce.comment_id) FROM comment_emotes ce WHERE ce.comment_id = c.comment_id) END DESC,
	created_at DESC
LIMIT :limit;

/* @name update */
UPDATE comments 
SET body = :body!
WHERE comment_uid = :id!;

/* @name insert */
INSERT INTO comments (
	comment_uid,
	parent_comment_id,
	user_id,
	post_id,
	body
) VALUES (
	:id!,
	CASE WHEN :parentID::TEXT IS NULL THEN NULL 
		ELSE (SELECT comment_id FROM comments WHERE comment_uid = :parentID)
	END,
	(SELECT user_id FROM users WHERE user_uid = :userID!),
	(SELECT post_id FROM posts WHERE post_uid = :postID!),
	:body!
);

/* 
  @name remove
  @param ids -> (...)
*/
DELETE FROM comments WHERE comment_uid in :ids;
