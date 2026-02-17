import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { icon, elevation } from '../../constants/layout';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          ...elevation.raised,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={icon.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="format-list-checks" size={icon.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="pencil-outline" size={icon.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog-outline" size={icon.md} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
