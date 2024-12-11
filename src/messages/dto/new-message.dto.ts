import { User } from 'src/users/schemas/user.schema';
import { Message } from '../interfaces/message.interface';
import { Room } from '../../rooms/schemas/room.schema';

export class NewMessageDto {
  readonly roomId: Room['roomId'];
  readonly text: Message['text'];
  readonly author: User['userId'] | 'system';
}
