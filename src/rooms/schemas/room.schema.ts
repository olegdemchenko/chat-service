import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Message } from 'src/messages/schemas/message.schema';
import { User } from '../../users/schemas/user.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Room {
  @Prop({
    required: true,
    unique: true,
    default: uuidv4,
  })
  roomId: string;

  @Prop([String])
  messages: Message[];

  @Prop([String])
  participants: User[];

  @Prop([String])
  activeParticipants: User[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
