import type Tag from './Tag';
import type User from './User';
import type Emote from './Emote';
import type Category from './Category';

export default interface Post {
  id: string;
  title: string;
  summary: string;
  content: unknown[];
  numViews: number;
  visible: boolean;
  numComments: number;
  tags?: Partial<Tag>[];
  author: Partial<User>;
  category: Partial<Category>[];
  comments?: Partial<Comment>[];
  reactionMap?: Map<Partial<Emote>, number | Partial<User>>;
}
