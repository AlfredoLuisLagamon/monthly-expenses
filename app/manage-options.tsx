import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSheetId } from '../contexts/SheetIdContext';
import { useExpenses } from '../hooks/useExpenses';
import {
  addPaymentMethod,
  addPayor,
  deletePaymentMethodOption,
  deletePayorOption,
} from '../lib/api';
import { spacing, borderRadius, iconSize } from '../constants/layout';

export default function ManageOptionsScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const router = useRouter();
  const { data, loading, reload } = useExpenses();
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newPayor, setNewPayor] = useState('');
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [addingPayor, setAddingPayor] = useState(false);
  const [removingPaymentMethodIndex, setRemovingPaymentMethodIndex] = useState<number | null>(null);
  const [removingPayorIndex, setRemovingPayorIndex] = useState<number | null>(null);

  const paymentMethods = data?.paymentMethods ?? [];
  const payors = data?.payors ?? [];

  const handleAddPaymentMethod = async () => {
    const name = newPaymentMethod.trim();
    if (!name || !sheetId) return;
    setAddingPaymentMethod(true);
    try {
      await addPaymentMethod(sheetId, name);
      setNewPaymentMethod('');
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAddingPaymentMethod(false);
    }
  };

  const handleAddPayor = async () => {
    const name = newPayor.trim();
    if (!name || !sheetId) return;
    setAddingPayor(true);
    try {
      await addPayor(sheetId, name);
      setNewPayor('');
      await reload();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAddingPayor(false);
    }
  };

  const handleDeletePaymentMethod = (index: number) => {
    if (!sheetId) return;
    const name = paymentMethods[index];
    Alert.alert('Remove option', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setRemovingPaymentMethodIndex(index);
          deletePaymentMethodOption(sheetId, index + 2)
            .then(reload)
            .catch(() => {})
            .finally(() => setRemovingPaymentMethodIndex(null));
        },
      },
    ]);
  };

  const handleDeletePayor = (index: number) => {
    if (!sheetId) return;
    const name = payors[index];
    Alert.alert('Remove option', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setRemovingPayorIndex(index);
          deletePayorOption(sheetId, index + 2)
            .then(reload)
            .catch(() => {})
            .finally(() => setRemovingPayorIndex(null));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Manage options</Text>
        <View style={{ width: 50 }} />
      </View>
      {!sheetId ? (
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Set your Sheet ID in Settings first.
          </Text>
        </View>
      ) : loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment methods</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newPaymentMethod}
                onChangeText={setNewPaymentMethod}
                placeholder="e.g. BPI, GCash"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddPaymentMethod}
                disabled={!newPaymentMethod.trim() || addingPaymentMethod}
              >
                {addingPaymentMethod ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.addBtnText}>Adding…</Text>
                  </>
                ) : (
                  <Text style={styles.addBtnText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
            {paymentMethods.map((pm, i) => (
              <View key={pm} style={[styles.optionRow, { borderColor: colors.border }]}>
                <Text style={[styles.optionText, { color: colors.text }]}>{pm}</Text>
                {removingPaymentMethodIndex === i ? (
                  <ActivityIndicator size="small" color={colors.unpaid} />
                ) : (
                  <TouchableOpacity onPress={() => handleDeletePaymentMethod(i)}>
                    <Text style={[styles.removeText, { color: colors.unpaid }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payors</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newPayor}
                onChangeText={setNewPayor}
                placeholder="e.g. Juan, Maria"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddPayor}
                disabled={!newPayor.trim() || addingPayor}
              >
                {addingPayor ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.addBtnText}>Adding…</Text>
                  </>
                ) : (
                  <Text style={styles.addBtnText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
            {payors.map((p, i) => (
              <View key={p} style={[styles.optionRow, { borderColor: colors.border }]}>
                <Text style={[styles.optionText, { color: colors.text }]}>{p}</Text>
                {removingPayorIndex === i ? (
                  <ActivityIndicator size="small" color={colors.unpaid} />
                ) : (
                  <TouchableOpacity onPress={() => handleDeletePayor(i)}>
                    <Text style={[styles.removeText, { color: colors.unpaid }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  back: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  hint: { fontSize: 14 },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  section: { paddingVertical: spacing.base, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: 16 },
  removeText: { fontSize: 14 },
});
