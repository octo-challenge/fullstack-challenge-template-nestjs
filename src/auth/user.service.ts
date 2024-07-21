import { Injectable } from '@nestjs/common'
import { FindOneOptions } from 'typeorm'
import { UserDTO } from './dto/user.dto'
import { UserRepository } from './user.repository'
import * as bcrypt from 'bcrypt'
import { User } from './entity/user.entity'

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findByFields(
    options: FindOneOptions<UserDTO>,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne(options)
  }

  async save(userDTO: UserDTO): Promise<UserDTO | undefined> {
    await this.transformPassword(userDTO)
    return await this.userRepository.save(userDTO)
  }

  async transformPassword(user: UserDTO): Promise<void> {
    user.password = await bcrypt.hash(user.password, 10)
    return Promise.resolve()
  }
}
