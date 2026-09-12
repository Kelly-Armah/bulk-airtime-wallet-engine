import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Network, TransactionStatus } from 'src/enums';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'wallet',
    required: true,
  })
  walletId!: Types.ObjectId;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  network!: string;

  @Prop({
    required: true,
    enum: TransactionStatus,
  })
  status!: TransactionStatus;

  @Prop()
  reason?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
export { TransactionStatus };
