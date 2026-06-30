import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export const Permission = (
  module: string,
  action: PermissionMetadata['action'],
) =>
  SetMetadata(PERMISSION_KEY, {
    module,
    action,
  });
