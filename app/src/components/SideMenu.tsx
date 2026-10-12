import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../state/SessionProvider';

const WIDTH = 280;

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

/** Botón ☰ del header que abre el menú lateral con el usuario y "Cerrar sesión". */
export function MenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={styles.menuButton}
        accessibilityLabel="Abrir menú"
      >
        <Ionicons name="menu" size={26} color="#1f2933" />
      </Pressable>
      <SideMenu visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SideMenu({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const { user, logout } = useSession();
  const insets = useSafeAreaInsets();
  // El modal se dibuja bajo la barra de estado aunque la app no lo haga.
  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0);
  const progress = useRef(new Animated.Value(0)).current;
  // Se mantiene montado mientras termina la animación de cierre.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  if (!mounted) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] });

  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar menú" />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          { paddingBottom: 16 + insets.bottom, transform: [{ translateX }] },
        ]}
      >
        <View style={[styles.profile, { paddingTop: 24 + topInset }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? initials(user.name) : ''}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Pressable style={[styles.item, styles.itemActive]} onPress={onClose}>
          <Ionicons name="car-outline" size={22} color="#1b5e9c" />
          <Text style={[styles.itemText, styles.itemTextActive]}>Vehículos</Text>
        </Pressable>

        <View style={styles.spacer} />

        <Pressable
          style={styles.item}
          onPress={() =>
            Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cerrar sesión',
                style: 'destructive',
                onPress: () => {
                  onClose();
                  logout();
                },
              },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={22} color="#c62828" />
          <Text style={[styles.itemText, styles.logout]}>Cerrar sesión</Text>
        </Pressable>
        <Text style={styles.version}>GME Flota · v1.0</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuButton: { marginRight: 16 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: WIDTH,
    backgroundColor: '#fff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  profile: { backgroundColor: '#1b5e9c', paddingHorizontal: 20, paddingBottom: 20, marginBottom: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#1b5e9c' },
  name: { fontSize: 18, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: '#d6e4f0', marginTop: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: '#e8f0f8' },
  itemText: { fontSize: 15, fontWeight: '600', color: '#1f2933' },
  itemTextActive: { color: '#1b5e9c' },
  logout: { color: '#c62828' },
  spacer: { flex: 1 },
  version: { fontSize: 12, color: '#9aa5b1', textAlign: 'center', marginTop: 8 },
});
