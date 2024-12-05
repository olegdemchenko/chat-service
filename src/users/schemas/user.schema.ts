import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Room } from 'src/rooms/interfaces/room.interface';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true, default: uuidv4 })
  userId: string;

  @Prop({ required: true, unique: true })
  externalId: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    default: [],
  })
  rooms: Room[];
}

export const UserSchema = SchemaFactory.createForClass(User);
