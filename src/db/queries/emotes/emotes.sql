/* @name getEmotes */
SELECT emote_id as "id", emote_body as "body" FROM emotes;

/* @name getPosts */
SELECT 
  (SELECT user_uid FROM users WHERE user_id = e.user_id) as "userID!",
  (SELECT post_uid FROM posts WHERE post_id = e.post_id) as "postID!",
  emote_id as "id!"
FROM post_emotes e
WHERE post_id IN (SELECT post_id FROM posts WHERE post_uid = ANY (:postIDs))
AND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL);


/* @name getComments */
SELECT 
  (SELECT user_uid FROM users WHERE user_id = e.user_id) as "userID!",
  (SELECT comment_uid FROM comments WHERE comment_id = e.comment_id) as "commentID!",
  emote_id as "id!"
FROM comment_emotes e
WHERE comment_id IN (SELECT comment_id FROM comments WHERE comment_uid = ANY (:commentIDs))
AND (e.user_id = (SELECT user_id FROM users WHERE user_uid = :userID) OR :userID IS NULL);

/* @name insertForPost */
INSERT INTO post_emotes (post_id, user_id, emote_id) VALUES (
  (SELECT post_id FROM posts WHERE post_uid = :postID),
  (SELECT user_id FROM users WHERE user_uid = :userID),
  :id
);

/* @name insertForComment */
INSERT INTO comment_emotes (comment_id, user_id, emote_id) VALUES (
  (SELECT comment_id FROM comments WHERE comment_uid = :commentID),
  (SELECT user_id FROM users WHERE user_uid = :userID),
  :id
);

/* @name updatePostEmote */
UPDATE post_emotes SET emote_id = :id
WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
AND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID);


/* @name updateCommentEmote */
UPDATE comment_emotes SET emote_id = :id
WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
AND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID);

/* @name removeFromPost */
DELETE FROM post_emotes
WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
AND post_id = (SELECT post_id FROM posts WHERE post_uid = :postID);

/* @name removeFromComment */
DELETE FROM comment_emotes
WHERE user_id = (SELECT user_id FROM users WHERE user_uid = :userID)
AND comment_id = (SELECT comment_id FROM comments WHERE comment_uid = :commentID);
