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

describe('checkEmoteExists', () => {
  it('Returns true if the emote ID exists', async () => {
    const realID = 1;
    const dbEmotes = [{ id: realID, body: '👍' }];
    vi.spyOn(emoteDB.getEmotes, 'run').mockResolvedValue(dbEmotes);
    const emoteExists = await emote.checkEmoteExists(realID);
    expect(emoteExists).toBe(true);
  });

  it('Returns false if the emote ID doesnt exist', async () => {
    const fakeID = 1;
    const dbEmotes = [{ id: fakeID + 1, body: '👍' }];
    vi.spyOn(emoteDB.getEmotes, 'run').mockResolvedValue(dbEmotes);
    const emoteExists = await emote.checkEmoteExists(fakeID);
    expect(emoteExists).toBe(false);
  });
});

describe('getPostEmoteCounts', () => {
  it('Aggregates emote counts per post in objects', async () => {
    const postIDs = ['1', '2', '3'];
    const dbData = [
      { postID: '1', emoteID: 1, count: 5 },
      { postID: '1', emoteID: 2, count: 1 },
      { postID: '1', emoteID: 5, count: 2 },
      { postID: '2', emoteID: 1, count: 3 },
      { postID: '2', emoteID: 2, count: 1 },
      { postID: '3', emoteID: 2, count: 4 },
    ];
    const expectedOutput = {
      1: [
        { emoteID: 1, count: 5 },
        { emoteID: 2, count: 1 },
        { emoteID: 5, count: 2 },
      ],
      2: [
        { emoteID: 1, count: 3 },
        { emoteID: 2, count: 1 },
      ],
      3: [{ emoteID: 2, count: 4 }],
    };
    const dbSpy = vi
      .spyOn(emoteDB.getPostCumulative, 'run')
      .mockResolvedValue(dbData);
    const output = await emote.getPostEmoteCounts(postIDs);
    expect(output).toMatchObject(expectedOutput);
    expect(dbSpy.mock.calls[0][0]).toMatchObject({ postIDs });
  });
});

describe('getCommentEmoteCounts', () => {
  it('Aggregates emote counts per post in objects', async () => {
    const commentIDs = ['1', '2', '3'];
    const dbData = [
      { commentID: '1', emoteID: 1, count: 5 },
      { commentID: '1', emoteID: 2, count: 1 },
      { commentID: '1', emoteID: 5, count: 2 },
      { commentID: '2', emoteID: 1, count: 3 },
      { commentID: '2', emoteID: 2, count: 1 },
      { commentID: '3', emoteID: 2, count: 4 },
    ];
    const expectedOutput = {
      1: [
        { emoteID: 1, count: 5 },
        { emoteID: 2, count: 1 },
        { emoteID: 5, count: 2 },
      ],
      2: [
        { emoteID: 1, count: 3 },
        { emoteID: 2, count: 1 },
      ],
      3: [{ emoteID: 2, count: 4 }],
    };
    const dbSpy = vi
      .spyOn(emoteDB.getCommentCumulative, 'run')
      .mockResolvedValue(dbData);
    const output = await emote.getCommentEmoteCounts(commentIDs);
    expect(output).toMatchObject(expectedOutput);
    expect(dbSpy.mock.calls[0][0]).toMatchObject({ commentIDs });
  });
});
