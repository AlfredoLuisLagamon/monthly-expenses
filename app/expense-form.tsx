import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSheetId } from '../contexts/SheetIdContext';
import { useExpenses } from '../hooks/useExpenses';
import { addMaster, updateMaster } from '../lib/api';
import { space, radius, headerPaddingTop, touchTargetMin } from '../constants/layout';
import { typography } from '../constants/typography';

type Params = {
  id?: string;
  name?: string;
  paymentMethod?: string;
  payor?: string;
  amount?: string;
  order?: string;
  sheetRowIndex?: string;
};

export default function ExpenseFormScreen() {
  const { colors } = useTheme();
  const { sheetId } = useSheetId();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { data, reload } = useExpenses();
  const isEdit = params.sheetRowIndex != null && params.sheetRowIndex !== '';

  const [name, setName] = useState(params.name ?? '');
  const [paymentMethod, setPaymentMethod] = useState(params.paymentMethod ?? '');
  const [payor, setPayor] = useState(params.payor ?? '');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentMethods = data?.paymentMethods ?? [];
  const payors = data?.payors ?? [];

  useEffect(() => {
    if (data && !paymentMethod && paymentMethods.length) setPaymentMethod(paymentMethods[0]);
    if (data && !payor && payors.length) setPayor(payors[0]);
  }, [data, paymentMethods.length, payors.length]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (!sheetId) {
      setError('Set Sheet ID in Settings first');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const rowIndex = Number(params.sheetRowIndex);
        if (!Number.isInteger(rowIndex) || rowIndex < 2) throw new Error('Invalid row');
        await updateMaster(sheetId, rowIndex, {
          Id: params.id ?? '',
          Name: trimmedName,
          'Payment Method': paymentMethod.trim(),
          Payor: payor.trim(),
          Amount: amount.trim(),
          Order: params.order ?? '',
        });
      } else {
        await addMaster(sheetId, {
          Name: trimmedName,
          'Payment Method': paymentMethod.trim(),
          Payor: payor.trim(),
          Amount: amount.trim(),
        });
      }
      await reload(true);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {saving ? 'Saving…' : isEdit ? 'Edit expense' : 'Add expense'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.save, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.unpaid + '30' }]}>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          </View>
        )}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Water, Rent"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Payment method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {paymentMethods.map((pm) => (
            <TouchableOpacity
              key={pm}
              style={[
                styles.chip,
                { backgroundColor: paymentMethod === pm ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setPaymentMethod(pm)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: paymentMethod === pm ? colors.onPrimary : colors.text }]}>
                {pm}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {paymentMethods.length === 0 && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Add options in Settings → Manage options
          </Text>
        )}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Payor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {payors.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.chip,
                { backgroundColor: payor === p ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setPayor(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: payor === p ? colors.onPrimary : colors.text }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Amount (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType={Platform.OS === 'web' ? 'numeric' : 'decimal-pad'}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  cancel: { ...typography.bodyLarge },
  title: { ...typography.titleLarge },
  save: { ...typography.bodyLarge, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: space.base, paddingBottom: space.xxl },
  errorBanner: { padding: space.md, borderRadius: radius.sm, marginBottom: space.base },
  errorText: { ...typography.bodyMedium },
  label: { ...typography.labelMedium, marginBottom: space.xs, marginTop: space.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    ...typography.bodyLarge,
  },
  chipScroll: { marginVertical: space.sm, maxHeight: touchTargetMin },
  chip: {
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginRight: space.sm,
  },
  chipText: { ...typography.labelLarge },
  hint: { ...typography.labelMedium, marginTop: space.xs },
});
