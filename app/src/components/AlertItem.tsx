import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });

/** Check verde de "Leída"; con `animate` entra con un rebote. */
function ReadBadge({ animate }: { animate: boolean }) {
  const scale = useRef(new Animated.Value(animate ? 0.3 : 1)).current;

  useEffect(() => {
    if (animate) {
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
    }
  }, [animate, scale]);

  return (
    <Animated.View style={[styles.readBadge, { transform: [{ scale }], opacity: scale }]}>
      <Ionicons name="checkmark-circle" size={16} color="#2e9e5b" />
      <Text style={styles.readText}>Leída</Text>
    </Animated.View>
  );
}

interface Props {
  alert: Alert;
  onMarkAsRead(id: string): void;
}

export function AlertItem({ alert, onMarkAsRead }: Props) {
  // Solo se anima si la alerta se marca mientras está en pantalla.
  const initiallyRead = useRef(alert.read).current;

  return (
    <View style={[styles.item, alert.read ? styles.read : styles.unread]}>
      <Text style={[styles.message, alert.read && styles.readMessage]}>{alert.message}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{formatDate(alert.createdAt)}</Text>
        {alert.read ? (
          <ReadBadge animate={!initiallyRead} />
        ) : (
          <Pressable
            onPress={() => onMarkAsRead(alert.id)}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Ionicons name="checkmark" size={16} color="#1b5e9c" />
            <Text style={styles.actionText}>Marcar como leída</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10, borderLeftWidth: 4 },
  unread: { borderLeftColor: '#e67e22' },
  read: { borderLeftColor: '#2e9e5b' },
  message: { fontSize: 15, fontWeight: '600', color: '#1f2933' },
  readMessage: { fontWeight: '400', color: '#616e7c' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 12, color: '#7b8794' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b9d0e6',
  },
  actionPressed: { backgroundColor: '#e8f0f8' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#1b5e9c' },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#e6f6ec',
  },
  readText: { fontSize: 13, fontWeight: '600', color: '#2e9e5b' },
});
