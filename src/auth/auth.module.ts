import { pipe, flow } from 'fp-ts/function'
import * as math from 'mathjs'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'
import { TypeOrmExModule } from './repository/typeorm-ex.module'
import { User } from './entity/user.entity'
import { JwtStrategy } from './strategy/passport.jwt.strategy'
import { UserAuthority } from './entity/user-authority.entity'
import { UserAuthorityRepository } from './repository/user-authority.repository'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuthority]),
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      UserAuthorityRepository,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET')
        return {
          secret,
          signOptions: {
            expiresIn: pipe(
              math.chain(1).multiply(60).multiply(5).done(),
              (v) => `${v}s`,
            ),
          },
        }
      },
    }),
  ],
  exports: [TypeOrmModule, TypeOrmExModule],
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtStrategy],
})
export class AuthModule {}
