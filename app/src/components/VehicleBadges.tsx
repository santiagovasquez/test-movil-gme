import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { VehicleStatus } from '../lib/positions';

export const STATUS_STYLE: Record<VehicleStatus, { label: string; color: string; background: string }> = {
  moving: { label: 'En movimiento', color: '#2e9e5b', background: '#e6f6ec' },
  stopped: { label: 'Detenido', color: '#b7791f', background: '#fdf3dc' },
  stale: { label: 'Sin señal', color: '#c62828', background: '#fde8e8' },
  noData: { label: 'Sin datos', color: '#52606d', background: '#e4e7eb' },
};

/** Ícono según el tipo que indica el nombre ("Camión 01", "Furgón 03"). */
function iconFor(label: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const name = label.toLowerCase();
  if (name.startsWith('cami')) return 'truck';
  if (name.startsWith('furg')) return 'van-utility';
  return 'car';
}

export function VehicleIcon({
  label,
  status,
  size = 46,
}: {
  label: string;
  status: VehicleStatus;
  size?: number;
}) {
  const { color, background } = STATUS_STYLE[status];
  return (
    <View
      style={[
        styles.icon,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    >
      <MaterialCommunityIcons name={iconFor(label)} size={size * 0.52} color={color} />
    </View>
  );
}

export function StatusChip({ status }: { status: VehicleStatus }) {
  const { label, color, background } = STATUS_STYLE[status];
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },
});
