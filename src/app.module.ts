import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { User } from './auth/entity/user.entity'
import { UserAuthority } from './auth/entity/user-authority.entity'
import { CatsController } from './cats/cats.controller'
import { CatsService } from './cats/cats.service'
import { CatsModule } from './cats/cats.module'
import { Cat } from './cats/entity/cats.entity'
import { CookiesModule } from './cookies/cookies.module'
import { ConfigModule } from '@nestjs/config'
import { pipe, flow } from 'fp-ts/function'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.prod'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: pipe(process.env.DB_PORT, Number),
      username: pipe(process.env.DB_USER),
      password: pipe(process.env.DB_PASSWORD),
      database: pipe(process.env.DB_NAME),
      entities: [User, UserAuthority, Cat],
      synchronize: true,
    }),
    AuthModule,
    CatsModule,
    CookiesModule,
  ],
  controllers: [AppController, CatsController],
  providers: [AppService, CatsService],
})
export class AppModule {}
