import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class AppleCallbackDto {
  @IsString()
  @MinLength(1)
  identity_token: string;

  @IsString()
  @MinLength(1)
  authorization_code: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  nom?: string;
}
