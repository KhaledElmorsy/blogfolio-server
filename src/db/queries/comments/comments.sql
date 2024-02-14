/* @name tree */
WITH RECURSIVE comment_tree AS (
	SELECT 1 as depth, root.parent_node_id, rc.*
	FROM nodes root
	INNER JOIN comments rc on rc.node_id = root.node_id
	AND root.node_id = :node!
	UNION
	SELECT ct.depth+1 as n, child.parent_node_id, cc.*
	FROM nodes child
	INNER JOIN comments cc on cc.node_id = child.node_id
	INNER JOIN comment_tree ct ON child.parent_node_id = ct.node_id
	AND (ct.depth < :depth OR :depth IS NULL)
) select 
	parent_node_id as "parentNode",
	node_id as node,
	comment_uid as id,
	user_id as "user__id",
	body,
	created_at as "createdAt",
	edited_at as "editedAt"
from comment_tree;

/* @name getId */
SELECT comment_id as "__id" FROM comments WHERE comment_uid = :id!;

/* @name find */
SELECT 
  c.comment_uid as id,
  u.user_uid as "userId",
  c.body,
  c.node_id as node,
  c.created_at as "createdAt",
  c.edited_at as "editedAt"
FROM comments c
INNER JOIN users u ON c.user_id = u.user_id
WHERE 
  (c.comment_id = :__id OR :__id is NULL)
  AND (c.comment_uid = :id OR :id is NULL)
  AND (c.node_id = :node OR :node is NULL)
  AND (c.user_id = :user__id OR :user__id is NULL);

/* @name edit */
UPDATE comments 
SET body = :body!
WHERE comment_id = :id!;

/* 
  @name drop
  @param __ids -> (...)
*/
DELETE FROM comments WHERE comment_id in :__ids;


/* @name test */
SELECT createComment(:userId, :id, :body, :parentNode);
