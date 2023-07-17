import type Emote from './Emote';
import type Reaction from './Reaction';
import type Post from './Post';

export default interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  bio: string;
  password: string;
  photo: {
    small: string;
    full: string
  }
  role?: 'user'|'admin';
  posts?: Partial<Post>[];
  comments?: Partial<Comment>[];
  reactions?: Partial<Reaction>;
  emotes?: Partial<Emote>;
}
