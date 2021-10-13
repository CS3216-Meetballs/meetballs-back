import { ChangeNameDto } from './dto/change-name.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { ZoomUser } from '../shared/interface/zoom-user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findByUuid(uuid: string): Promise<User> {
    return this.userRepository.findOne({ uuid });
  }

  findByZoomId(zoomId: string): Promise<User> {
    return this.userRepository.findOne({ zoomId });
  }

  findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ email });
  }

  async doesEmailExist(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    return !!user;
  }

  createUser(
    user: Pick<User, 'firstName' | 'lastName' | 'email' | 'passwordHash'>,
  ): Promise<User> {
    const partialUser = this.userRepository.create(user);
    return this.userRepository.save(partialUser);
  }

  updateZoomUser(zoomUser: ZoomUser): Promise<User> {
    const {
      id,
      first_name,
      last_name,
      email,
      type,
      language,
      pic_url,
      account_id,
      status,
    } = zoomUser;
    console.log(zoomUser);
    const partialUser = this.userRepository.create({
      zoomId: id,
      email,
      isEmailConfirmed: true,
      firstName: first_name,
      lastName: last_name,
      type: type,
    });
    return this.userRepository.save(partialUser);
  }

  async updateName(uuid: string, changeNameDto: ChangeNameDto): Promise<User> {
    const user = await this.userRepository.findOne({ uuid });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    const updatedUser = { ...user, ...changeNameDto };
    await this.userRepository.save(updatedUser);
    return this.userRepository.findOne({ uuid });
  }

  async setRefreshToken(
    refreshTokenHash: string,
    uuid: string,
  ): Promise<boolean> {
    try {
      await this.userRepository.update({ uuid }, { refreshTokenHash });
      console.log('Add refresh token');
      return true;
    } catch (err) {
      console.log('Error saving token', err);
      return false;
    }
  }

  async removeRefreshToken(uuid: string): Promise<boolean> {
    try {
      await this.userRepository.update({ uuid }, { refreshTokenHash: null });
      return true;
    } catch (err) {
      console.log('Error deleting token', err);
      return false;
    }
  }

  async activateAccount(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailConfirmed) {
      // already verified
      return false;
    }
    await this.userRepository.update(
      { uuid: user.uuid },
      { isEmailConfirmed: true },
    );
    return true;
  }

  async setPassword(uuid: string, passwordHash: string): Promise<boolean> {
    try {
      await this.userRepository.update({ uuid }, { passwordHash });
      return true;
    } catch (err) {
      console.log('Error setting password', err);
      return false;
    }
  }
}
