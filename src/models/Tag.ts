import type Category from './Category';

export default interface Tag {
  id: string;
  category: Category;
  name: string;
  imageURL: string;
}
