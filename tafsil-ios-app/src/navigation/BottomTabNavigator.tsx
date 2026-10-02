import React from 'react';
import { Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SurahListScreen } from '../screens/SurahListScreen';
import { MemorizationListScreen } from '../screens/MemorizationListScreen';
import { DagExplorerScreen } from '../screens/DagExplorerScreen';
import { FloatingTabBar } from './FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 260,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-36, 0, 36],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="SurahList" component={SurahListScreen} />
      <Tab.Screen name="Memorization" component={MemorizationListScreen} />
      <Tab.Screen name="DagExplorer" component={DagExplorerScreen} />
    </Tab.Navigator>
  );
}

