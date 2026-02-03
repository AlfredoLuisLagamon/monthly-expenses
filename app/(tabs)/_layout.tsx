import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { iconSize } from '../../constants/layout';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarShowLabel: true,
        headerStyle: { backgroundColor: colors.surface, borderBottomColor: colors.border },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={iconSize.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="format-list-checks" size={iconSize.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="pencil-outline" size={iconSize.md} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name="cog-outline" size={iconSize.md} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
