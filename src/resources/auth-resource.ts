import { ResourceConfig } from '@/utilities/resource';

const registerResource: ResourceConfig = {
  only: [
    'id', 'uuid', 'email', 'name', 'role_id',
    'status', 'email_verified_at', 'created_at',
  ],
};

module.exports = {
  register: registerResource,
};
