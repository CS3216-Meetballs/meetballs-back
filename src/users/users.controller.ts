import { User } from './entities/user.entity';
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
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

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
  @ApiParam({ name: 'uuid', description: 'The id of the profile to query' })
  @Get(':uuid')
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<User> {
    return this.usersService
      .findByUuid(uuid)
      .then((user) => {
        if (user) {
          return user;
        } else {
          throw new NotFoundException('User not found');
        }
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
  }

  @Patch(':uuid')
  update(@Param('uuid') uuid: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(uuid, updateUserDto);
  }
}
