import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Lawrence Kelly Armah' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '100' })
  @IsNumber()
  walletBalance!: number;
}
