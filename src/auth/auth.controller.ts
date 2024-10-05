import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { UserDTO } from './dto/user.dto'
import { AuthGuard } from './guard/auth.guard'
import { RolesGuard } from './role.guard'
import { RoleType } from './role-type'
import { Roles } from './repository/role.decorator'
import { AppRequest } from './dto/app-request.dto'
import { UserService } from './user.service'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { JwtRefreshGuard } from './guard/jwt-refresh.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('/sign-up')
  async signUp(@Body() userDTO: UserDTO) {
    return await this.authService.registerUser(userDTO)
  }

  @Post('/sign-in')
  async signin(@Body() userDTO: UserDTO, @Res() res: Response) {
    const user = await this.authService.validateUser(userDTO)
    const access_token = await this.authService.generateAccessToken(user)
    const refresh_token = await this.authService.generateRefreshToken(user)

    // 유저 객체에 refresh-token 데이터 저장
    await this.userService.setCurrentRefreshToken(refresh_token, user.id)

    res.setHeader('Authorization', 'Bearer ' + access_token)
    res.cookie('access_token', access_token, {
      httpOnly: true,
    })
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
    })
    return res.json({
      message: 'login success',
      access_token,
      refresh_token,
    })
  }

  @Post('sign-out')
  @UseGuards(JwtRefreshGuard)
  async signout(@Req() req: AppRequest, @Res() res: Response) {
    await this.userService.removeRefreshToken(req.user.id)
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    return res.send({
      message: 'signout success',
    })
  }

  @Get('/admin-role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  adminRoleCheck(@Req() req: AppRequest): any {
    const user: any = req.user
    return user
  }

  // 가드(AuthGuard) 추가해주기
  @Get('/authenticate')
  @UseGuards(AuthGuard)
  async isAuthenticated(@Req() req: AppRequest, @Res() res: Response) {
    const userId = req.user.id
    const verifiedUser = await this.userService.findByFields({
      where: { id: userId },
    })
    return res.send(verifiedUser)
  }

  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const newAccessToken = (await this.authService.refresh(refreshTokenDto))
        .access_token
      res.setHeader('Authorization', 'Bearer ' + newAccessToken)
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
      })
      res.send({ access_token: newAccessToken })
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh-token')
    }
  }
}
