import type Reaction from './Reaction';
import type User from './User';

export default interface Comment {
  id: string;
  author: Partial<User>;
  parent: Partial<User | Comment>;
  body: String;
  comments?: Partial<Comment>[];
  numComments?: number;
  reactions: Partial<Reaction>[];
}
