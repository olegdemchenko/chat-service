import { Message } from '../interfaces/message.interface';
import { Room } from '../interfaces/room.interface';

export class UpdateMessageDto {
  readonly roomId: Room['roomId'];
  readonly messageId: Message['messageId'];
  readonly newText: Message['text'];
}
