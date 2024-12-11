import { Types } from 'mongoose';

export interface Room<T = Types.ObjectId, K = Types.ObjectId> {
  roomId: string;
  messages: Types.Array<T>;
  participants: Types.Array<K>;
  activeParticipants: Types.Array<K>;
  messagesCount: number;
}
