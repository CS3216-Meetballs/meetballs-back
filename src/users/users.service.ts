import { UpdateUserDto } from './dto/update-user.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findByUuid(uuid: string): Promise<User> {
    return this.userRepository.findOne({ uuid }, { relations: ['profile'] });
  }

  findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ email }, { relations: ['profile'] });
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

  update(uuid: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userRepository.findOne({ uuid }).then((user) => {
      if (!user) {
        throw new NotFoundException('User does not exist');
      }
      const updatedUser = { ...user, ...updateUserDto };
      return this.userRepository.save(updatedUser);
    });
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
