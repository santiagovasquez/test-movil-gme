import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Logo } from '../components/Logo';
import { useSession } from '../state/SessionProvider';

export function LoginScreen() {
  const { login, notice } = useSession();
  const [email, setEmail] = useState('supervisor@gme.co');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      // Si el login funciona, la pantalla se desmonta: no tocar su estado (D7).
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Logo />

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Correo"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={[styles.input, styles.passwordRow]}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            onSubmitEditing={handleSubmit}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={10}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#616e7c" />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f7fa' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, gap: 12 },
  notice: { backgroundColor: '#fff4e5', color: '#8a4b00', padding: 10, borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd2d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, gap: 8 },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  error: { color: '#c62828' },
  button: {
    backgroundColor: '#1b5e9c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
