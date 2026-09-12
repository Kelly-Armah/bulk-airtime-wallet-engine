import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({
    type: Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  balance!: number;

  @Prop({ required: true })
  currency!: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
