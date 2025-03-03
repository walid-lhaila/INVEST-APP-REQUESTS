import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestsDto {
  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  receiver: string;

  @IsOptional()
  @IsEnum(['pending', 'accepted', 'rejected'])
  status?: string;
}
