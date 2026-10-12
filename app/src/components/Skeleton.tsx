import { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

/** Bloque gris que pulsa mientras llegan los datos. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

/** Tarjeta con la misma forma que `VehicleRow`. */
export function VehicleRowSkeleton() {
  return (
    <View style={[styles.card, styles.column]}>
      <View style={styles.row}>
        <Skeleton style={{ width: 46, height: 46, borderRadius: 23 }} />
        <View style={styles.main}>
          <Skeleton style={{ width: '55%', height: 16 }} />
          <Skeleton style={{ width: '75%', height: 12 }} />
        </View>
        <Skeleton style={{ width: 84, height: 20, borderRadius: 10 }} />
      </View>
      <View style={styles.row}>
        <Skeleton style={{ width: 70, height: 12 }} />
        <Skeleton style={{ width: 60, height: 12 }} />
        <Skeleton style={{ width: 60, height: 12 }} />
      </View>
    </View>
  );
}

/** Tarjeta con `lines` renglones de etiqueta y valor, como las del detalle. */
export function CardSkeleton({ lines }: { lines: number }) {
  return (
    <View style={[styles.card, styles.column]}>
      <Skeleton style={{ width: '45%', height: 16, marginBottom: 4 }} />
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} style={styles.line}>
          <Skeleton style={{ width: '30%', height: 12 }} />
          <Skeleton style={{ width: '25%', height: 12 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#e4e7eb', borderRadius: 6 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  column: { flexDirection: 'column', gap: 10 },
  main: { flex: 1, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
});
