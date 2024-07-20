import { pipe, flow } from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { UserDTO } from './dto/user.dto'
import { User } from './entity/user.entity'
import { UserService } from './user.service'
import * as bcrypt from 'bcrypt'
import { Payload } from './security/payload.interface'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async registerUser(newUser: UserDTO): Promise<UserDTO> {
    const userFind: UserDTO = await this.userService.findByFields({
      where: { user_email: newUser.user_email },
    })
    if (userFind) {
      throw new HttpException('User email aleady used!', HttpStatus.BAD_REQUEST)
    }
    return await this.userService.save(newUser)
  }

  private convertInAuthorities(user: User) {
    if (user && user.authorities) {
      user.authorities = pipe(
        user.authorities,
        A.map((authority) => ({ name: authority.authorityName })),
      )
    }
    return user
  }

  private flatAuthorities(user: User) {
    if (user && user.authorities) {
      user.authorities = pipe(
        user.authorities,
        A.map((authority) => authority.authorityName),
      )
    }
    return user
  }

  async validateUser(
    userDTO: UserDTO,
  ): Promise<{ accessToken: string } | undefined> {
    const userFind: User = await this.userService.findByFields({
      where: { user_email: userDTO.user_email },
    })
    const validatePassword = await bcrypt.compare(
      userDTO.password,
      userFind.password,
    )
    if (!userFind || !validatePassword) {
      throw new UnauthorizedException()
    }
    // don't give the password, it's not good way to authorize with JWT!
    this.convertInAuthorities(userFind)
    const payload: Payload = {
      id: userFind.id,
      user_email: userFind.user_email,
      authorities: userFind.authorities,
    }
    return {
      accessToken: this.jwtService.sign(payload),
    }
  }

  async tokenValidateUser(payload: Payload) {
    const userFind = await this.userService.findByFields({
      where: { id: payload.id },
    })
    this.flatAuthorities(userFind)
    return userFind
  }
}
