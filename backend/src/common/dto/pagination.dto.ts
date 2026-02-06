import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export function paginate(dto: PaginationDto) {
  const page = dto.page || 1;
  const limit = dto.limit || 20;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function paginationMeta(total: number, dto: PaginationDto) {
  const page = dto.page || 1;
  const limit = dto.limit || 20;
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
