import { pipe, flow } from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UserDTO } from './dto/user.dto'
import { User } from './entity/user.entity'
import { UserService } from './user.service'
import * as bcrypt from 'bcrypt'
import { Payload } from './dto/payload.interface'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RefreshTokenDto } from './dto/refresh-token.dto'

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
    if (!userFind) {
      throw new NotFoundException('User not found!')
    }
    if (!validatePassword) {
      throw new BadRequestException('Invalid credentials!')
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
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ),
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

  async refresh(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string }> {
    const { refresh_token } = refreshTokenDto

    const secret = this.configService.get('JWT_REFRESH_SECRET')
    // Verify refresh token
    // JWT Refresh Token 검증 로직
    const decodedRefreshToken = this.jwtService.verify(refresh_token, {
      secret,
    })

    const userId = decodedRefreshToken.id
    const user = await this.userService.getUserIfRefreshTokenMatches(
      refresh_token,
      userId,
    )
    if (!user) {
      throw new UnauthorizedException('Invalid user!')
    }

    // Generate new access token
    const access_token = await this.generateAccessToken(user)

    return { access_token }
  }
}
