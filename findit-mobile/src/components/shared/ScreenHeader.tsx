import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../../constants/theme';

type ScreenHeaderProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function useTopBarOffset(extra: number = spacing.sm): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}

export function ScreenHeader({ children, style }: ScreenHeaderProps) {
  const topOffset = useTopBarOffset();
  return <View style={[{ paddingTop: topOffset }, style]}>{children}</View>;
}
