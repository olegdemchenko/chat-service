import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    required: true,
    unique: true,
    default: uuidv4,
  })
  messageId: string;

  @Prop({
    required: true,
  })
  text: string;

  @Prop([String])
  author: User['userId'][];

  @Prop([String])
  readBy: User['userId'][];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
