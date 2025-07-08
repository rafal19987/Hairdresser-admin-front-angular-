import {Role} from '../role/role.types';

export interface User {
  uuid: string,
  username: string,
  email: string,
  active: boolean,
  firstName?: string,
  lastName?: string,
  invitationToken?: string,
  invitationDate?: Date,
  role?: Role,
  createdAt: Date,
  updatedAt?: Date,
  deletedAt?: Date,
  deleted: boolean,
}
