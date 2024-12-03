import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Room {
  @Prop({
    required: true,
    unique: true,
  })
  roomId: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] })
  messages: mongoose.Schema.Types.ObjectId[];

  @Prop([String])
  participants: User[];

  @Prop([String])
  activeParticipants: User[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
