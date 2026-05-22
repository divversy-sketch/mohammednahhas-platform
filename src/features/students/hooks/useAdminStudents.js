import { useMemo } from 'react';

export const useAdminStudents = ({ users = [], pendingUsers = [] } = {}) => useMemo(() => ({
  users,
  pendingUsers,
  activeUsers: users.filter((user) => user.status !== 'pending'),
  bannedUsers: users.filter((user) => String(user.status || '').startsWith('banned'))
}), [users, pendingUsers]);

export default useAdminStudents;
