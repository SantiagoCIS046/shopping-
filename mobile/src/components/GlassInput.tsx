import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

/** Campo de texto estilo glass oscuro. */
export function GlassInput(props: TextInputProps) {
  const { style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      style={[styles.input, style]}
      placeholderTextColor="rgba(232, 236, 244, 0.4)"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    color: '#F5F0E8',
    fontSize: 15,
  },
});
