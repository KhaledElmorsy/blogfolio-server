import type Post from './Post';
import type Tag from './Tag';

export default interface Category {
  id: string;
  name: string;
  posts: Partial<Post>[];
  tags: Partial<Tag>[];
  subCategories: Partial<Category>[];
  parentCategory: Partial<Category> | null;
}
