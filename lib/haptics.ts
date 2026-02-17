import * as Haptics from 'expo-haptics';

export function selectionFeedback() {
  Haptics.selectionAsync().catch(() => {});
}

export function impactFeedback(style: 'light' | 'medium' | 'heavy' = 'medium') {
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[style]).catch(() => {});
}

export function notificationFeedback(type: 'success' | 'warning' | 'error') {
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };
  Haptics.notificationAsync(map[type]).catch(() => {});
}
