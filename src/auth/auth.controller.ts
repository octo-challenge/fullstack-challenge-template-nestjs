import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { UserDTO } from './dto/user.dto'
import { AuthGuard } from './security/auth.guard'
import { RolesGuard } from './role.guard'
import { RoleType } from './role-type'
import { Roles } from './repository/role.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async registerAccount(@Req() req: Request, @Body() userDTO: UserDTO) {
    return await this.authService.registerUser(userDTO)
  }

  @Post('/login')
  async login(@Body() userDTO: UserDTO, @Res() res: Response) {
    const jwt = await this.authService.validateUser(userDTO)
    res.setHeader('Authorization', 'Bearer ' + jwt.accessToken)
    return res.json(jwt)
  }

  @Get('/admin-role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  adminRoleCheck(@Req() req: Request): any {
    const user: any = req.user
    return user
  }

  // 가드(AuthGuard) 추가해주기
  @Get('/authenticate')
  @UseGuards(AuthGuard)
  isAuthenticated(@Req() req: Request) {
    const user = req.user
    return user
  }
}
