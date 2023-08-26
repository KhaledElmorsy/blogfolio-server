import { testData } from '@/db/test-utils';

type UserCollection = typeof testData.users;
type UserFollowCollection = typeof testData.user_follows;

type BaseUser = (typeof testData)['users'][number];
export type User = { [k in keyof BaseUser]: BaseUser[k] };
export type UserField = keyof User;
type UserId = User['user_id'];
type UserUid = User['user_uid'];

export default class {
  users: UserCollection;

  userMaps: {
    id: Record<UserId, User>;
    uid: Record<UserUid, User>;
  };

  userFollows: UserFollowCollection;

  followerMap: Record<UserId, UserId[]>;

  followingMap: Record<UserId, UserId[]>;

  constructor({
    users,
    userFollows,
  }: {
    users: UserCollection;
    userFollows: UserFollowCollection;
  }) {
    this.users = users;
    this.userFollows = userFollows;
    this.userMaps = {
      id: Object.fromEntries(users.map((user) => [user.user_id, user])),
      uid: Object.fromEntries(users.map((user) => [user.user_uid, user])),
    };

    [this.followerMap, this.followingMap] = userFollows.reduce(
      ([followerMap, followingMap], { user_id, follower_id }) => {
        followerMap[user_id] ??= [];
        followerMap[user_id].push(follower_id);

        followingMap[follower_id] ??= [];
        followingMap[follower_id].push(user_id);
        return [followerMap, followingMap];
      },
      [{}, {}] as Record<UserId, UserId[]>[],
    );
  }

  getFollowers(targetId: UserId) {
    return (this.followerMap[targetId] ?? []).map(
      (user_id) => this.userMaps.id[user_id],
    );
  }

  getFollowerCount(targetId: UserId) {
    return this.followerMap[targetId]?.length ?? 0;
  }

  getFollowing(targetId: UserId) {
    return (this.followingMap[targetId] ?? []).map(
      (follower_id) => this.userMaps.id[follower_id],
    );
  }

  getFollowingCount(targetId: UserId) {
    return this.followingMap[targetId]?.length ?? 0;
  }
}
