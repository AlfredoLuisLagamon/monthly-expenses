import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { THEME_PRESETS } from '../../constants/storage';
import { spacing, borderRadius } from '../../constants/layout';
import { extractSheetId } from '../../lib/sheetId';
import { validateWorkbook } from '../../lib/api';

export default function SettingsScreen() {
  const { colors, themeId, setThemeId } = useTheme();
  const { sheetId, setSheetId } = useSheetId();
  const router = useRouter();
  const [input, setInput] = useState(sheetId ?? '');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    setInput(sheetId ?? '');
  }, [sheetId]);

  const handleSaveSheetId = async () => {
    const id = extractSheetId(input);
    if (!id.trim()) {
      setSheetId(null);
      return;
    }
    setValidating(true);
    try {
      const result = await validateWorkbook(id);
      if (result.valid) {
        setSheetId(id);
        Alert.alert('Saved', 'Sheet ID saved and validated.');
      } else {
        Alert.alert('Validation failed', result.error);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not validate sheet');
    } finally {
      setValidating(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Sheet</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Paste Sheet ID or full URL. Share the workbook with your service account (Editor).
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="Sheet ID or https://docs.google.com/..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={handleSaveSheetId}
          disabled={validating}
        >
          {validating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.btnText}>Validating…</Text>
            </>
          ) : (
            <Text style={styles.btnText}>Save & validate</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage options</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Add or remove Payment methods and Payors used in expenses.
        </Text>
        <TouchableOpacity
          style={[styles.linkBtn, { borderColor: colors.border }]}
          onPress={() => router.push('/manage-options')}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Open Manage options</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {THEME_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.themeChip,
                {
                  backgroundColor: themeId === preset.id ? preset.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setThemeId(preset.id)}
            >
              <Text
                style={[
                  styles.themeChipText,
                  { color: themeId === preset.id ? '#fff' : colors.text },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Monthly recurring expenses checklist. Data is stored in your Google Sheet.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  section: { paddingVertical: spacing.base, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.sm },
  hint: { fontSize: 14, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  btn: { flexDirection: 'row', paddingVertical: spacing.base, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  btnText: { color: '#fff', fontWeight: '600' },
  linkBtn: { borderWidth: 1, paddingVertical: spacing.md, borderRadius: borderRadius.sm, alignItems: 'center' },
  linkText: { fontWeight: '600' },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  themeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  themeChipText: { fontSize: 14, fontWeight: '500' },
});
