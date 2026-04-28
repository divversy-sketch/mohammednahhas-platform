export const SECURITY_POLICY = {
  studentAIEnabled: false,
  adminAIEnabled: true,
  localStudentAnalysis: true,
  showLeaderboardByDefault: false
};

export function canUseAdminAI(userData = {}) {
  return Boolean(userData?.isAdmin || userData?.role === 'admin');
}
