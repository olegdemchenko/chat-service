import { Message } from '../interfaces/message.interface';
import { Room } from '../../rooms/schemas/room.schema';

export class UpdateMessageDto {
  readonly roomId: Room['roomId'];
  readonly messageId: Message['messageId'];
  readonly newText: Message['text'];
}
