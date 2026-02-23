export interface UsersServices {
  uuid: string;
  user: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  service: {
    uuid: string;
    name: string;
    description: string;
    active: boolean;
  };
  price: number;
  duration: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUsersServicesPayload {
  userUuid: string;
  serviceUuid: string;
  price: number;
  duration: number;
  active?: boolean;
}

export interface UpdateUsersServicesPayload {
  price?: number;
  duration?: number;
  active?: boolean;
}
