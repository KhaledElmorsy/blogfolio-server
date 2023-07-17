import type Emote from './Emote';
import type User from './User';
import type Post from './Post';

export default interface Reaction {
  id: string;
  user: Partial<User>;
  parent: Partial<Post | Comment>;
  emote: Partial<Emote>;
}
