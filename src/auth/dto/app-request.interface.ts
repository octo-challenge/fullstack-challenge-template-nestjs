// express-request.interface.ts
import { Request } from 'express'
import { UserDTO } from './user.dto'

export interface AppRequest extends Request {
  user?: UserDTO
}
