import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../state/SessionProvider';

export function VehiclesScreen() {
  const { user, logout } = useSession();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hola, {user?.name}</Text>
        <Pressable onPress={logout}>
          <Text style={styles.link}>Salir</Text>
        </Pressable>
      </View>
      <Text style={styles.placeholder}>Aquí va la lista de vehículos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2933' },
  link: { color: '#1b5e9c', fontWeight: '600' },
  placeholder: { color: '#7b8794' },
});
