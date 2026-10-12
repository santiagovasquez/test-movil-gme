import { StyleSheet, Text } from 'react-native';
import type { NetworkStatus } from '../lib/poller';

/** Aviso discreto tras varios fallos seguidos; desaparece con la siguiente respuesta (HU-2). */
export function NetworkBanner({ status }: { status: NetworkStatus }) {
  if (status === 'ok') return null;
  return <Text style={styles.banner}>Reconectando…</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff4e5',
    color: '#8a4b00',
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 13,
  },
});
