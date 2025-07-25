import { ResourceConfig } from '@/utilities/resource';

const resource: ResourceConfig = {
  only: [
    'id', 'uuid', 'email', 'name', 'role_id',
    'status', 'email_verified_at', 'created_at',
  ],
};

module.exports = resource;
