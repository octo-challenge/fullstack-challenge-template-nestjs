import { Repository } from 'typeorm'
import { UserAuthority } from '../entity/user-authority.entity'
import { CustomRepository } from './typeorm-ex.decorator'

@CustomRepository(UserAuthority)
export class UserAuthorityRepository extends Repository<UserAuthority> {}
