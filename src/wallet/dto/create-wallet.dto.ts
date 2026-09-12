import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({})
  @IsMongoId()
  userId!: string;

  @ApiProperty({ example: '100' })
  @IsNumber()
  @IsPositive()
  balance!: number;

  @ApiProperty({ example: 'GHC' })
  @IsString()
  currency!: string;
}
