import { pipe, flow } from 'fp-ts/function'
import * as math from 'mathjs'
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
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
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

  async validateUser(userDTO: UserDTO): Promise<User | undefined> {
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
    return userFind
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: Payload = {
      id: user.id,
      user_email: user.user_email,
      authorities: user.authorities,
    }
    return this.jwtService.sign(payload)
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: Payload = {
      id: user.id,
      user_email: user.user_email,
      authorities: user.authorities,
    }
    // refresh 토큰에는 유저정보가 담겨져있을 필요가 있을까? > 없다
    // 그래서 어떤 유저의 토큰인지를 알 수 있는 "식별자"만 포함
    return this.jwtService.sign(
      { id: payload.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: pipe(
          math
            .chain(1)
            .multiply(60)
            .multiply(60)
            .multiply(24)
            .multiply(7)
            .done(),
          (v) => `${v}s`,
        ), //'7d',
      },
    )
  }

  async tokenValidateUser(payload: Payload) {
    const userFind = await this.userService.findByFields({
      where: { id: payload.id },
    })
    this.flatAuthorities(userFind)
    return userFind
  }
}
