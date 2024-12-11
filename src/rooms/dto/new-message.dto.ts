import { User } from 'src/users/schemas/user.schema';
import { Message } from '../../messages/interfaces/message.interface';
import { Room } from '../interfaces/room.interface';

export class NewMessageDto {
  readonly roomId: Room['roomId'];
  readonly text: Message['text'];
  readonly author: User['userId'] | 'system';
}
