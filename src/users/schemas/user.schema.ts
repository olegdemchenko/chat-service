import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../../rooms/schemas/room.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true, default: uuidv4 })
  userId: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    type: [String],
    default: [],
  })
  rooms: Room[];
}

export const UserSchema = SchemaFactory.createForClass(User);
