import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WalletService } from 'src/wallet/wallet.service';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from './schema/transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    private walletService: WalletService,

    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async processTransaction(walletId: string, amount: number) {
    const wallet = await this.walletService.tryDeductBalance(walletId, amount);

    if (!wallet) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return {
      message: 'Wallet deducted successfully',
      balance: wallet.balance,
    };
  }

  private normalizePhoneNumber(phone: string): string {
    phone = phone.trim();

    // +233241234567 -> 0241234567
    if (phone.startsWith('+233')) {
      return '0' + phone.substring(4);
    }

    // 233241234567 -> 0241234567
    if (phone.startsWith('233')) {
      return '0' + phone.substring(3);
    }

    // Already local format
    return phone;
  }

  async processCsv(file: Express.Multer.File, walletId: string) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const rows: any[] = [];

    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csvParser())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const validRecords: any[] = [];
    const rejectedRecords: any[] = [];

    // Validate every row
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const errors: string[] = [];

      const phoneNumber = row.phone_number?.trim();
      const amount = Number(row.amount);
      const network = row.network?.trim();

      // Phone validation
      if (!phoneNumber) {
        errors.push('Phone number is required');
      } else if (!/^0\d{9}$/.test(phoneNumber)) {
        errors.push('Invalid Ghanaian phone number');
      }

      // Amount validation
      if (!row.amount) {
        errors.push('Amount is required');
      } else if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }

      // Network validation
      const validNetworks = ['MTN', 'Telecel', 'AT'];

      if (!network) {
        errors.push('Network is required');
      } else if (!validNetworks.includes(network)) {
        errors.push('Network must be MTN, Telecel, or AT');
      }

      if (errors.length > 0) {
        await this.transactionModel.create({
          walletId,
          phoneNumber: phoneNumber || '',
          amount: isNaN(amount) ? 0 : amount,
          network: network || '',
          status: TransactionStatus.REJECTED,
          reason: errors.join(', '),
        });

        rejectedRecords.push({
          row: index + 2,
          phone_number: phoneNumber,
          amount,
          network,
          status: 'rejected',
          reason: errors.join(', '),
        });
        continue;
      }
      // Validation successful
      validRecords.push({
        row: index + 2,
        phone_number: phoneNumber,
        amount,
        network,
      });
    }

    // Get wallet
    const wallet = await this.walletService.getWallet(walletId);

    const successfulRecords: any[] = [];

    // Process each valid transaction individually
    for (const record of validRecords) {
      const updatedWallet = await this.walletService.tryDeductBalance(
        walletId,
        record.amount,
      );

      // Insufficient balance
      if (!updatedWallet) {
        await this.transactionModel.create({
          walletId,
          phoneNumber: record.phone_number,
          amount: record.amount,
          network: record.network,
          status: TransactionStatus.REJECTED,
          reason: 'insufficient balance',
        });
        rejectedRecords.push({
          ...record,
          status: 'rejected',
          reason: 'insufficient balance',
        });

        continue;
      }

      // Transaction successful
      await this.transactionModel.create({
        walletId,
        phoneNumber: record.phone_number,
        amount: record.amount,
        network: record.network,
        status: TransactionStatus.SUCCESSFUL,
      });
      successfulRecords.push({
        ...record,
        status: 'successful',
        remainingBalance: updatedWallet.balance,
      });
    }

    // Get final wallet balance
    const finalWallet = await this.walletService.getWallet(walletId);

    return {
      message: 'CSV processing completed',

      totalRecords: rows.length,

      successfulTransactions: successfulRecords.length,

      rejectedTransactions: rejectedRecords.length,

      initialBalance: wallet.balance,

      finalBalance: finalWallet.balance,

      successful: successfulRecords,

      rejected: rejectedRecords,
    };
  }

  create(createTransactionDto: CreateTransactionDto) {
    return 'This action adds a new transaction';
  }

  findAll() {
    return `This action returns all transaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
