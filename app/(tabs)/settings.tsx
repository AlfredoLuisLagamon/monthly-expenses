import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSheetId } from '../../contexts/SheetIdContext';
import { THEME_PRESETS } from '../../constants/storage';
import { space, radius, elevation, touchTargetMin } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { extractSheetId } from '../../lib/sheetId';
import { validateWorkbook, getBaseUrl } from '../../lib/api';

export default function SettingsScreen() {
  const { colors, themeId, setThemeId } = useTheme();
  const { sheetId, setSheetId } = useSheetId();
  const router = useRouter();
  const [input, setInput] = useState(sheetId ?? '');
  const [validating, setValidating] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const apiBaseUrl = getBaseUrl();

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
      const msg = e instanceof Error ? e.message : 'Could not validate sheet';
      const isNetwork = /network request failed|failed to fetch|load failed/i.test(msg);
      Alert.alert(
        'Error',
        isNetwork
          ? 'Cannot reach the server. Check your internet connection and try again. The first request to a hosted API can take a few seconds—try again.'
          : msg
      );
    } finally {
      setValidating(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/health`, { method: 'GET' });
      const text = await res.text();
      if (res.ok) {
        Alert.alert('Connection OK', `Server responded: ${text}`);
      } else {
        Alert.alert('Connection failed', `HTTP ${res.status}: ${text}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Connection failed', msg);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.sectionCard, styles.sectionCardElevation, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>API</Text>
        <Text style={[styles.apiUrl, { color: colors.textSecondary }]} numberOfLines={2}>
          {apiBaseUrl}
        </Text>
        <TouchableOpacity
          style={[styles.testBtn, styles.testBtnElevation, { backgroundColor: colors.surface }]}
          onPress={handleTestConnection}
          disabled={testingConnection}
          activeOpacity={0.8}
        >
          {testingConnection ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.testBtnText, { color: colors.primary }]}>Test connection</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={[styles.sectionCard, styles.sectionCardElevation, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Sheet</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Paste Sheet ID or full URL. Share the workbook with your service account (Editor).
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          value={input}
          onChangeText={setInput}
          placeholder="Sheet ID or https://docs.google.com/..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnElevation, { backgroundColor: colors.primary }]}
          onPress={handleSaveSheetId}
          disabled={validating}
          activeOpacity={0.8}
        >
          {validating ? (
            <>
              <ActivityIndicator size="small" color={colors.onPrimary} />
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>Validating…</Text>
            </>
          ) : (
            <Text style={[styles.btnText, { color: colors.onPrimary }]}>Save & validate</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, styles.sectionCardElevation, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage options</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Add or remove Payment methods and Payors used in expenses.
        </Text>
        <TouchableOpacity
          style={[styles.linkBtn, styles.linkBtnElevation, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/manage-options')}
          activeOpacity={0.8}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Open Manage options</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, styles.sectionCardElevation, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {THEME_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.themeChip,
                themeId === preset.id && styles.themeChipElevation,
                {
                  backgroundColor: themeId === preset.id ? preset.primary : colors.background,
                },
              ]}
              onPress={() => setThemeId(preset.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeChipText,
                  { color: themeId === preset.id ? colors.onPrimary : colors.text },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.sectionCard, styles.sectionCardElevation, { backgroundColor: colors.surface }]}>
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
  content: { padding: space.base, paddingBottom: space.xxl, gap: space.base },
  sectionCard: {
    padding: space.xl,
    borderRadius: radius.lg,
    marginBottom: space.base,
  },
  sectionCardElevation: { ...elevation.card },
  sectionTitle: { ...typography.titleLarge, marginBottom: space.sm },
  hint: { ...typography.bodyMedium, marginBottom: space.md },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
    marginBottom: space.base,
    ...typography.bodyLarge,
  },
  btn: {
    flexDirection: 'row',
    paddingVertical: space.base,
    minHeight: touchTargetMin,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  btnElevation: { ...elevation.raised },
  btnText: { ...typography.labelLarge, fontWeight: '600' },
  apiUrl: { ...typography.bodySmall, marginBottom: space.sm },
  testBtn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.base,
    minHeight: touchTargetMin,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  testBtnElevation: { ...elevation.card },
  testBtnText: { fontWeight: '600' },
  linkBtn: {
    paddingVertical: space.md,
    minHeight: touchTargetMin,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnElevation: { ...elevation.card },
  linkText: { fontWeight: '600' },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  themeChip: {
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  themeChipElevation: { ...elevation.raised },
  themeChipText: { ...typography.labelLarge },
});
