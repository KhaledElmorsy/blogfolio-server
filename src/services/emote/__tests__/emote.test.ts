import { describe, expect, it, vi } from 'vitest';
import { emotes as emoteDB } from '@/db';
import { emote } from '..';

describe('getEmotes', () => {
  it('Calls and returns the output of the DB handler', async () => {
    const output: any[] = [];
    const getEmoteSpy = vi
      .spyOn(emoteDB.getEmotes, 'run')
      .mockResolvedValue(output);
    const emotes = await emote.getEmotes();
    expect(getEmoteSpy).toHaveBeenCalledOnce();
    expect(emotes).toBe(output);
  });
});

describe('getPostEmotes', () => {
  it('Passes inputs to DB handler and returns results', async () => {
    const output: any[] = [];
    const postEmoteSpy = vi
      .spyOn(emoteDB.getPosts, 'run')
      .mockResolvedValue(output);
    const postIDs = ['a', 'b'];
    const userID = 'userID';
    const result = await emote.getPostEmotes(postIDs, userID);
    expect(postEmoteSpy).toHaveBeenCalledOnce();
    expect(postEmoteSpy.mock.calls[0][0]).toMatchObject({
      postIDs,
      userID,
    });
    expect(result).toBe(output);
  });
});

describe('getCommentEmotes', () => {
  it('Passes inputs to DB handler and returns results', async () => {
    const output: any[] = [];
    const commentEmoteSpy = vi
      .spyOn(emoteDB.getComments, 'run')
      .mockResolvedValue(output);
    const commentIDs = ['a', 'b'];
    const userID = 'userID';
    const result = await emote.getCommentEmotes(commentIDs, userID);
    expect(commentEmoteSpy).toHaveBeenCalledOnce();
    expect(commentEmoteSpy.mock.calls[0][0]).toMatchObject({
      commentIDs,
      userID,
    });
    expect(result).toBe(output);
  });
});

describe('addToPost', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const addToPostSpy = vi
      .spyOn(emoteDB.insertForPost, 'run')
      .mockImplementation(async () => []);
    const postID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    await emote.addToPost({ emoteID, postID, userID });
    expect(addToPostSpy).toHaveBeenCalledOnce();
    expect(addToPostSpy.mock.calls[0][0]).toMatchObject({
      postID,
      userID,
      id: emoteID,
    });
  });
});

describe('addToComment', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const addToCommentSpy = vi
      .spyOn(emoteDB.insertForComment, 'run')
      .mockImplementation(async () => []);
    const commentID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    await emote.addToComment({ emoteID, commentID, userID });
    expect(addToCommentSpy).toHaveBeenCalledOnce();
    expect(addToCommentSpy.mock.calls[0][0]).toMatchObject({
      commentID,
      userID,
      id: emoteID,
    });
  });
});

describe('updatePostEmote', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const updatePostSpy = vi
      .spyOn(emoteDB.updatePostEmote, 'run')
      .mockImplementation(async () => []);
    const postID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    await emote.updatePostEmote({ emoteID, postID, userID });
    expect(updatePostSpy).toHaveBeenCalledOnce();
    expect(updatePostSpy.mock.calls[0][0]).toMatchObject({
      postID,
      userID,
      id: emoteID,
    });
  });
});

describe('updateCommentEmote', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const updateCommentSpy = vi
      .spyOn(emoteDB.updateCommentEmote, 'run')
      .mockImplementation(async () => []);
    const commentID = 'testID';
    const userID = 'userID';
    const emoteID = 1;
    await emote.updateCommentEmote({ emoteID, commentID, userID });
    expect(updateCommentSpy).toHaveBeenCalledOnce();
    expect(updateCommentSpy.mock.calls[0][0]).toMatchObject({
      commentID,
      userID,
      id: emoteID,
    });
  });
});

describe('removeFromPost', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const removeSpy = vi
      .spyOn(emoteDB.removeFromPost, 'run')
      .mockImplementation(async () => []);
    const postID = 'testID';
    const userID = 'userID';
    await emote.removeFromPost({ postID, userID });
    expect(removeSpy).toHaveBeenCalledOnce();
    expect(removeSpy.mock.calls[0][0]).toMatchObject({
      postID,
      userID,
    });
  });
});

describe('removeFromComment', () => {
  it('Passes inputs to DB handler and calls it', async () => {
    const removeSpy = vi
      .spyOn(emoteDB.removeFromComment, 'run')
      .mockImplementation(async () => []);
    const commentID = 'testID';
    const userID = 'userID';
    await emote.removeFromComment({ commentID, userID });
    expect(removeSpy).toHaveBeenCalledOnce();
    expect(removeSpy.mock.calls[0][0]).toMatchObject({
      commentID,
      userID,
    });
  });
});
