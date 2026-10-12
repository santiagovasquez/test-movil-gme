import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VehicleRowModel } from '../hooks/useVehicleList';
import { formatAgo } from '../lib/positions';
import { StatusChip, VehicleIcon } from './VehicleBadges';

interface Props extends VehicleRowModel {
  onPress(): void;
}

function Metric({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={styles.metricText}>{value}</Text>
    </View>
  );
}

export function VehicleRow({
  vehicle,
  status,
  speedKmh,
  secondsAgo,
  distanceKm,
  unread,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.top}>
        <VehicleIcon label={vehicle.label} status={status} />
        <View style={styles.titles}>
          <View style={styles.titleLine}>
            <Text style={styles.label}>{vehicle.label}</Text>
            <StatusChip status={status} />
          </View>
          <View style={styles.subtitle}>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <Ionicons name="person-outline" size={12} color="#7b8794" />
            <Text style={styles.driver} numberOfLines={1}>
              {vehicle.driver}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metrics}>
        <Metric
          icon={<MaterialCommunityIcons name="speedometer" size={16} color="#1b5e9c" />}
          value={speedKmh === null ? '—' : `${speedKmh} km/h`}
        />
        <Metric
          icon={<MaterialCommunityIcons name="map-marker-distance" size={16} color="#1b5e9c" />}
          value={`${distanceKm.toFixed(1)} km`}
        />
        <Metric
          icon={<Ionicons name="time-outline" size={15} color="#1b5e9c" />}
          value={secondsAgo === null ? '—' : formatAgo(secondsAgo)}
        />
        {unread > 0 ? (
          <View style={styles.alerts}>
            <Ionicons name="notifications" size={13} color="#c05621" />
            <Text style={styles.alertsText}>{unread}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1f2933',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.75 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titles: { flex: 1, gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 16, fontWeight: '700', color: '#1f2933' },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  plate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334e68',
    backgroundColor: '#eef2f7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  driver: { flexShrink: 1, fontSize: 13, color: '#616e7c' },
  divider: { height: 1, backgroundColor: '#eef2f7', marginVertical: 12 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { fontSize: 13, fontWeight: '600', color: '#334e68' },
  alerts: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff1e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  alertsText: { fontSize: 12, fontWeight: '700', color: '#c05621' },
});
