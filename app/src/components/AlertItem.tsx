import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });

interface Props {
  alert: Alert;
  onMarkAsRead(id: string): void;
}

export function AlertItem({ alert, onMarkAsRead }: Props) {
  return (
    <View style={[styles.item, alert.read ? styles.read : styles.unread]}>
      <Text style={[styles.message, alert.read && styles.readText]}>{alert.message}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{formatDate(alert.createdAt)}</Text>
        {alert.read ? (
          <Text style={styles.meta}>Leída</Text>
        ) : (
          <Pressable onPress={() => onMarkAsRead(alert.id)} hitSlop={8}>
            <Text style={styles.action}>Marcar como leída</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8, borderLeftWidth: 4 },
  unread: { borderLeftColor: '#e67e22' },
  read: { borderLeftColor: '#cbd2d9' },
  message: { fontSize: 15, fontWeight: '600', color: '#1f2933' },
  readText: { fontWeight: '400', color: '#616e7c' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 12, color: '#7b8794' },
  action: { fontSize: 13, fontWeight: '600', color: '#1b5e9c' },
});
