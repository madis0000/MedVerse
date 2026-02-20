import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../validators/password-policy.validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Min 12 chars, upper/lower/number/special' })
  @IsStrongPassword()
  newPassword: string;
}
