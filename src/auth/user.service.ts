import { Injectable } from '@nestjs/common'
import { FindOneOptions } from 'typeorm'
import { UserDTO } from './dto/user.dto'
import { UserRepository } from './user.repository'
import * as bcrypt from 'bcrypt'
import { User } from './entity/user.entity'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configService: ConfigService,
  ) {}

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

  async getCurrentHashedRefreshToken(refreshToken: string) {
    // 토큰 값을 그대로 저장하기 보단, 암호화를 거쳐 데이터베이스에 저장한다.
    // bcrypt는 단반향 해시 함수이므로 암호화된 값으로 원래 문자열을 유추할 수 없다.
    const saltOrRounds = 10
    const currentRefreshToken = await bcrypt.hash(refreshToken, saltOrRounds)
    return currentRefreshToken
  }

  async getCurrentRefreshTokenExp(): Promise<Date> {
    const currentDate = new Date()
    // Date 형식으로 데이터베이스에 저장하기 위해 문자열을 숫자 타입으로 변환(parseInt)
    const currentRefreshTokenExp = new Date(
      currentDate.getTime() +
        parseInt(this.configService.get('JWT_REFRESH_EXPIRATION_TIME')),
    )
    return currentRefreshTokenExp
  }

  // 로그인을 통한 인증(Authentication)시에 생성하게된 `Refresh-Token`을 데이터베이스에 저장시켜줘야한다.
  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentRefreshToken =
      await this.getCurrentHashedRefreshToken(refreshToken)
    const currentRefreshTokenExp = await this.getCurrentRefreshTokenExp()
    await this.userRepository.update(userId, {
      currentRefreshToken,
      currentRefreshTokenExp,
    })
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    userId: number,
  ): Promise<User> {
    const user: User = await this.findByFields({
      where: { id: userId },
    })

    // user에 currentRefreshToken이 없다면 null을 반환 (즉, 토큰 값이 null일 경우)
    if (!user.currentRefreshToken) {
      return null
    }

    // 유저 테이블 내에 정의된 암호화된 refresh_token값과 요청 시 body에 담아준 refresh_token값 비교
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentRefreshToken,
    )

    // 만약 isRefreshTokenMatching이 true라면 user 객체를 반환
    if (isRefreshTokenMatching) {
      return user
    }
  }

  async removeRefreshToken(userId: number) {
    return await this.userRepository.update(userId, {
      currentRefreshToken: null,
      currentRefreshTokenExp: null,
    })
  }
}
