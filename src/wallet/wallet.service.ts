import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schema/wallet.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  
  async tryDeductBalance(
    walletId: string,
    amount: number,
  ): Promise<WalletDocument | null> {
    if (amount <= 0) {
      return null;
    }

    return this.walletModel.findOneAndUpdate(
      {
        _id: walletId,
        balance: { $gte: amount },
      },
      {
        $inc: {
          balance: -amount,
        },
      },
      {
        returnDocument: 'after',
      },
    );
  }

  // get wallet
  async getWallet(walletId: string) {
    const wallet = await this.walletModel.findById(walletId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async create(createWalletDto: CreateWalletDto) {
    const wallet = new this.walletModel(createWalletDto);

    return wallet.save();
  }

  findAll() {
    return `This action returns all wallet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wallet`;
  }

  update(id: number, updateWalletDto: UpdateWalletDto) {
    return `This action updates a #${id} wallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
