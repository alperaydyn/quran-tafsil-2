import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SurahListScreen } from '../screens/SurahListScreen';
import { MemorizationStudioScreen } from '../screens/MemorizationStudioScreen';
import { DagExplorerScreen } from '../screens/DagExplorerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON: Record<keyof MainTabParamList, string> = {
  Home: '⌂',
  SurahList: '☰',
  Memorization: '◈',
  DagExplorer: '◎',
  Settings: '⚙',
};

const TAB_LABEL: Record<keyof MainTabParamList, string> = {
  Home: 'Anasayfa',
  SurahList: 'Oku',
  Memorization: 'Ezber',
  DagExplorer: 'Kavramlar',
  Settings: 'Ayarlar',
};

export function BottomTabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.acc,
        tabBarInactiveTintColor: theme.colors.faint,
        tabBarStyle: {
          backgroundColor: theme.colors.surf,
          borderTopColor: theme.colors.line,
        },
        tabBarLabel: ({ color }) => (
          <StyledText
            variant="caption"
            style={{ color, marginTop: -2 }}
          >
            {TAB_LABEL[route.name as keyof MainTabParamList]}
          </StyledText>
        ),
        tabBarIcon: ({ color }) => (
          <StyledText style={{ color, fontSize: 18 }}>
            {TAB_ICON[route.name as keyof MainTabParamList]}
          </StyledText>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="SurahList" component={SurahListScreen} />
      <Tab.Screen name="Memorization" component={MemorizationStudioScreen} />
      <Tab.Screen name="DagExplorer" component={DagExplorerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
