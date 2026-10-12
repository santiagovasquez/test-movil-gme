import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { FleetSummary } from '../hooks/useVehicleList';

function Tile({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileTop}>
        {icon}
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

/** Resumen de la flota sobre la lista. */
export function FleetSummaryBar({ summary }: { summary: FleetSummary }) {
  return (
    <View style={styles.bar}>
      <Tile
        icon={<MaterialCommunityIcons name="truck-outline" size={18} color="#1b5e9c" />}
        value={summary.total}
        label="Vehículos"
        color="#1b5e9c"
      />
      <Tile
        icon={<MaterialCommunityIcons name="navigation-variant-outline" size={18} color="#2e9e5b" />}
        value={summary.moving}
        label="En ruta"
        color="#2e9e5b"
      />
      <Tile
        icon={<MaterialCommunityIcons name="signal-off" size={18} color="#c62828" />}
        value={summary.stale}
        label="Sin señal"
        color="#c62828"
      />
      <Tile
        icon={<Ionicons name="notifications-outline" size={18} color="#c05621" />}
        value={summary.unread}
        label="Alertas"
        color="#c05621"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#1f2933',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11, color: '#7b8794', fontWeight: '600' },
});
