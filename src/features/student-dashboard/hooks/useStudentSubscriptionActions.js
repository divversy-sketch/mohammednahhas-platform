import { useState } from 'react';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { redeemStudentSubscriptionCode, validateSubscriptionCode } from '@features/subscriptions';

export function useStudentSubscriptionActions() {
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  const handleChargeSubscriptionCode = async (event) => {
    event.preventDefault();
    const validationMessage = validateSubscriptionCode(subscriptionCodeInput);
    if (validationMessage) return platformNotify(validationMessage);
    setIsCharging(true);
    try {
      const days = await redeemStudentSubscriptionCode(subscriptionCodeInput);
      platformNotify(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
      setSubscriptionCodeInput('');
    } catch (error) {
      console.error(error);
      platformNotify('حدث خطأ أثناء الشحن');
    } finally {
      setIsCharging(false);
    }
  };

  return { subscriptionCodeInput, setSubscriptionCodeInput, isCharging, handleChargeSubscriptionCode };
}
