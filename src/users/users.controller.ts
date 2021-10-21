import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';

@ApiTags('User')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Gets current user
   */
  @UseBearerAuth()
  @ApiOkResponse({
    description: 'Successfully get requested user',
    type: User,
  })
  @Get('/me')
  async findCurrent(@Usr() requester: User): Promise<User> {
    try {
      const user = await this.usersService.findByUuid(requester.uuid);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (e) {
      throw new NotFoundException('User not found');
    }
  }

  // /**
  //  * Gets a user by uuid
  //  */
  // @ApiOkResponse({
  //   description: 'Successfully get requested user',
  //   type: User,
  // })
  // @ApiParam({ name: 'uuid', description: 'The id of the user to query' })
  // @Get(':uuid')
  // async findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<User> {
  //   try {
  //     const user = await this.usersService.findByUuid(uuid);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     return user;
  //   } catch (e) {
  //     throw new NotFoundException('User not found');
  //   }
  // }

  // @UseBearerAuth()
  // @ApiOkResponse({
  //   description: 'Successfully updated user',
  //   type: User,
  // })
  // @ApiUnauthorizedResponse({ description: 'Not allowed to update this user' })
  // @Put(':uuid')
  // update(
  //   @Usr() requester: User,
  //   @Param('uuid') uuid: string,
  //   @Body() changeNameDto: ChangeNameDto,
  // ): Promise<User> {
  //   if (uuid !== requester.uuid) {
  //     throw new ForbiddenException('Not allowed to update this user');
  //   }
  //   return this.usersService.updateName(uuid, changeNameDto);
  // }
}
