import React from 'react';
import type { TextProps } from 'react-native';
import { Text } from 'react-native';

/**
 * Android trims trailing whitespace from Text nodes.
 * Appending a non-breaking space prevents this.
 */
export const SafeText: React.FC<TextProps & { children?: React.ReactNode }> = ({
  children,
  style,
  ...props
}) => (
  <Text style={style} {...props}>
    {children}{' '}
  </Text>
);
