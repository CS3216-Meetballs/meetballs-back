import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ChangeNameDto } from './dto/change-name.dto';

@ApiTags('User')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Gets a user by uuid
   */
  @ApiOkResponse({
    description: 'Successfully get requested user',
    type: User,
  })
  @ApiParam({ name: 'uuid', description: 'The id of the user to query' })
  @Get(':uuid')
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<User> {
    try {
      const user = await this.usersService.findByUuid(uuid);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (e) {
      throw new NotFoundException('User not found');
    }
  }

  @Patch(':uuid')
  update(
    @Param('uuid') uuid: string,
    @Body() changeNameDto: ChangeNameDto,
  ): Promise<User> {
    return this.usersService.updateName(uuid, changeNameDto);
  }
}
