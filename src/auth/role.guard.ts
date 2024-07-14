import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { User } from './entity/user.entity'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {} // 가드에 Reflector를 주입

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 가드에 주입받은 Reflector를 이용하여 메타데이터 리스트를 얻는다.
    const roles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!roles) {
      return true
    }
    // 실행 컨텍스트로부터 request 객체를 얻고, request 객체에 포함된 user 객체를 얻는다.
    const request = context.switchToHttp().getRequest()
    const user = request.user as User
    return (
      user &&
      user.authorities &&
      user.authorities.some((role) => roles.includes(role))
    )
  }
}
