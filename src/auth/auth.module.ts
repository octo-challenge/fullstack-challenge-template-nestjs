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

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuthority]),
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      UserAuthorityRepository,
    ]),
    JwtModule.register({
      secret: 'SECRET_KEY',
      signOptions: { expiresIn: '300s' },
    }),
    PassportModule,
  ],
  exports: [TypeOrmModule, TypeOrmExModule],
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtStrategy],
})
export class AuthModule {}
