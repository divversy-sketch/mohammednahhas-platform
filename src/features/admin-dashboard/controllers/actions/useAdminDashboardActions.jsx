import { createStudentLifecycleActions } from './studentLifecycleActions.jsx';
import { createSubscriptionActions } from './subscriptionActions.jsx';
import { createAdminDeleteActions } from './deleteActions.jsx';
import { createExamManagementActions } from './examActions.jsx';
import { createContentManagementActions } from './contentActions.jsx';
import { createCommunicationActions } from './communicationActions.jsx';

export const useAdminDashboardActions = (ctx) => ({
  ...createStudentLifecycleActions(ctx),
  ...createSubscriptionActions(ctx),
  ...createAdminDeleteActions(ctx),
  ...createExamManagementActions(ctx),
  ...createContentManagementActions(ctx),
  ...createCommunicationActions(ctx)
});

export default useAdminDashboardActions;
