import { BaseModelVM } from 'shared/base.model';
import { UserRole } from '../user-role.enum';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { EnumToArray } from 'shared/utilities/enum-to-array';

export class UserVm extends BaseModelVM {
  @ApiModelProperty() username: string;
  @ApiModelPropertyOptional() firstName?: string;
  @ApiModelPropertyOptional() lastName?: string;
  @ApiModelPropertyOptional() fullName?: string;
  @ApiModelPropertyOptional({ enum: EnumToArray(UserRole) })
  role?: UserRole;
}
