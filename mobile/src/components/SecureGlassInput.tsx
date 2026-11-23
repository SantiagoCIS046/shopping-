import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Campo de contraseña estilo glass con ojo para mostrar/ocultar el texto:
 * ojo tachado y gris = oculto; ojo abierto y azul = visible.
 */
export function SecureGlassInput(props: TextInputProps) {
  const { style, ...rest } = props;
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <TextInput
        {...rest}
        secureTextEntry={hidden}
        style={[styles.input, style]}
        placeholderTextColor="rgba(214, 222, 234, 0.4)"
      />
      <Pressable
        onPress={() => setHidden((current) => !current)}
        hitSlop={12}
        style={styles.eye}
        accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path
            d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"
            fill="none"
            stroke={hidden ? colors.textFaint : colors.accent}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={12}
            cy={12}
            r={2.6}
            fill={hidden ? colors.textFaint : colors.accent}
          />
          {hidden ? (
            <Line
              x1="4"
              y1="20"
              x2="20"
              y2="4"
              stroke={colors.textFaint}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingRight: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    color: colors.text,
    fontSize: 15,
  },
  eye: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
