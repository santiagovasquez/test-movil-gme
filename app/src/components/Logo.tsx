import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function Logo() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="navigate" size={34} color="#fff" />
      </View>
      <Text style={styles.name}>GME Flota</Text>
      <Text style={styles.tagline}>Supervisión de vehículos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, marginBottom: 8 },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#1b5e9c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 24, fontWeight: '700', color: '#1f2933' },
  tagline: { fontSize: 14, color: '#616e7c' },
});
