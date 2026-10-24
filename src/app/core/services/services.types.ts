export interface Service {
  uuid: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServicePayload {
  name: string;
  description: string;
  active?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  active?: boolean;
}
