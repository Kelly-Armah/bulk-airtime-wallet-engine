import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  walletBalance!: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
