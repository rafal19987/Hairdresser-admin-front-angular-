export interface Role {
  uuid: string;
  name: string;
  displayName?: string;
  permissions: Permission[]
}

export interface Permission {
  resource: string,
  actions: Actions[]
}

export type Actions = 'create' | 'read' | 'write' | 'delete' | 'all' | 'admin';
