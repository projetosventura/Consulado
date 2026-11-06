import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInt, IsString, IsUUID, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class ReserveTicketsDto {
  @IsUUID()
  raffleId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  numbers!: number[];

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  buyerName!: string;

  @IsEmail()
  buyerEmail!: string;

  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'Informe o telefone com DDD, apenas números.',
  })
  buyerPhone!: string;
}
