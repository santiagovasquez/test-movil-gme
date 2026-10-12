import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VehicleRowModel } from '../hooks/useVehicleList';
import { formatAgo } from '../lib/positions';

interface Props extends VehicleRowModel {
  onPress(): void;
}

export function VehicleRow({ vehicle, speedKmh, secondsAgo, stale, unread, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.main}>
        <Text style={styles.label}>{vehicle.label}</Text>
        <Text style={styles.detail}>
          {vehicle.plate} · {vehicle.driver}
        </Text>
      </View>
      <View style={styles.side}>
        {secondsAgo === null ? (
          <Text style={[styles.badge, styles.noData]}>Sin datos</Text>
        ) : (
          <>
            <Text style={styles.speed}>{speedKmh} km/h</Text>
            {stale ? <Text style={[styles.badge, styles.stale]}>Sin señal</Text> : null}
            <Text style={styles.detail}>{formatAgo(secondsAgo)}</Text>
          </>
        )}
        {unread > 0 ? (
          <Text style={[styles.badge, styles.unread]}>
            {unread} {unread === 1 ? 'alerta' : 'alertas'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  pressed: { opacity: 0.7 },
  main: { flex: 1, gap: 4 },
  side: { alignItems: 'flex-end', gap: 4 },
  label: { fontSize: 16, fontWeight: '600', color: '#1f2933' },
  detail: { fontSize: 13, color: '#616e7c' },
  speed: { fontSize: 16, fontWeight: '600', color: '#1f2933' },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  noData: { backgroundColor: '#e4e7eb', color: '#52606d' },
  stale: { backgroundColor: '#fde8e8', color: '#c62828' },
  unread: { backgroundColor: '#fff4e5', color: '#8a4b00' },
});
