import { AuthService } from './../auth.service'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt'
import { Payload } from '../security/payload.interface'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secret key는 외부에 노출되면 안되는 값이므로 환경변수나 config로 빼서 사용하는 것을 권장한다.
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    })
  }

  async validate(payload: Payload, done: VerifiedCallback) {
    const user = await this.authService.tokenValidateUser(payload)
    if (!user) {
      return done(
        new UnauthorizedException({ message: 'user does not exist' }),
        false,
      )
    }
    return done(null, user)
  }
}
