import { createExamReviewActions } from './examReviewActions.jsx';
import { createExamEditorActions } from './examEditorActions.jsx';
import { createExamSecurityActions } from './examSecurityActions.jsx';
import { createEssayGradingActions } from './essayGradingActions.jsx';
import { createExamBuilderActions } from './examBuilderActions.jsx';

export const createExamManagementActions = (ctx) => ({
  ...createExamReviewActions(ctx),
  ...createExamEditorActions(ctx),
  ...createExamSecurityActions(ctx),
  ...createEssayGradingActions(ctx),
  ...createExamBuilderActions(ctx)
});

export default createExamManagementActions;
