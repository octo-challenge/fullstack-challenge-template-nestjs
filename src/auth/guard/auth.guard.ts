import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<any> {
    try {
      const request = context.switchToHttp().getRequest()
      const access_token = request.cookies['access_token']
      const user = await this.jwtService.verify(access_token)
      request.user = user
      return user
    } catch (_error) {
      return false
    }
  }
}
