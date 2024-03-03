import { emotes as emoteDB, pool } from '@/db';

export function getEmotes() {
  return emoteDB.getEmotes.run(undefined, pool);
}

export function getPostEmotes(postIDs: string[], userID?: string) {
  return emoteDB.getPosts.run({ postIDs, userID }, pool);
}

export function getCommentEmotes(commentIDs: string[], userID?: string) {
  return emoteDB.getComments.run({ commentIDs, userID }, pool);
}

export function addToPost({
  postID,
  userID,
  emoteID,
}: {
  postID: string;
  userID: string;
  emoteID: number;
}) {
  return emoteDB.insertForPost.run({ id: emoteID, postID, userID }, pool);
}

export function addToComment({
  commentID,
  userID,
  emoteID,
}: {
  commentID: string;
  userID: string;
  emoteID: number;
}) {
  return emoteDB.insertForComment.run({ id: emoteID, commentID, userID }, pool);
}

export function updatePostEmote({
  postID,
  userID,
  emoteID,
}: {
  postID: string;
  userID: string;
  emoteID: number;
}) {
  return emoteDB.updatePostEmote.run({ id: emoteID, postID, userID }, pool);
}

export function updateCommentEmote({
  commentID,
  userID,
  emoteID,
}: {
  commentID: string;
  userID: string;
  emoteID: number;
}) {
  return emoteDB.updateCommentEmote.run(
    { id: emoteID, commentID, userID },
    pool,
  );
}

export function removeFromPost({
  postID,
  userID,
}: {
  postID: string;
  userID: string;
}) {
  return emoteDB.removeFromPost.run({ postID, userID }, pool);
}

export function removeFromComment({
  commentID,
  userID,
}: {
  commentID: string;
  userID: string;
}) {
  return emoteDB.removeFromComment.run({ commentID, userID }, pool);
}

export async function checkEmoteExists(emoteID: number) {
  const emotes = await emoteDB.getEmotes.run(undefined, pool);
  return Boolean(emotes.find((emote) => emote.id === emoteID));
}
