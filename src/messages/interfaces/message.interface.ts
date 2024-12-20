import { User } from 'src/users/schemas/user.schema';

export interface Message {
  messageId: string;
  text: string;
  author: User['userId'];
  createdAt: Date;
  updatedAt: Date;
  readBy: User['userId'][];
}
