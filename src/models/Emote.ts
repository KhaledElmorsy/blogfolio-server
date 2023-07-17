import type User from './User';

export default interface Emote {
  id: string;
  keyword: string;
  imageURL: string;
  creator: User;
  creationDate: Date;
}
