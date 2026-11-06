import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateRaffleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  prize!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  ticketPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(5000)
  totalNumbers!: number;

  @IsDateString()
  endsAt!: string;
}
