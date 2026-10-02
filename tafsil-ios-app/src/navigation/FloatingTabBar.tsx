import React from 'react';
import { StyleSheet, View, Pressable, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import { useTranslation } from '../i18n';
import type { MainTabParamList } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAB_ICON: Record<keyof MainTabParamList, string> = {
  Home: '⌂',
  SurahList: '☰',
  Memorization: '◈',
  DagExplorer: '◎',
};

/**
 * tafsil.net Yüzen Alt Menü (Floating Island Tab Bar)
 *
 * Özellikler:
 * - Ekran altına yapışmayan, kenarlardan içe çekilmiş yüzen kapsül dokusu
 * - Buzlu cam / sıcak kağıt geçirgenliği (Glassmorphism & subtle shadow)
 * - Aktif sekmede genişleyen kontrastlı hap (pill) ve zarif etiket
 * - Pasif sekmelerde minimal ve sükûnet odaklı çizgisel ikonlar
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.scheme === 'dark';

  const tabLabels: Record<keyof MainTabParamList, string> = {
    Home: t('tabs.home'),
    SurahList: t('tabs.surahs'),
    Memorization: t('tabs.memorization'),
    DagExplorer: t('tabs.concepts'),
  };

  // Açık ve Koyu mod için yüzen dock renkleri
  const dockBg = isDark
    ? 'rgba(26, 24, 20, 0.94)'
    : 'rgba(251, 249, 244, 0.94)';

  const activePillBg = isDark
    ? '#F4F1EA'
    : '#171613';

  const activeContentColor = isDark
    ? '#171613'
    : '#FFFFFF';

  const inactiveIconColor = isDark
    ? '#8E887E'
    : '#8A857A';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom + 8, Platform.OS === 'ios' ? 18 : 12),
        },
      ]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: dockBg,
            borderColor: theme.colors.line,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.35 : 0.08,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const routeName = route.name as keyof MainTabParamList;
          const icon = TAB_ICON[routeName] || '•';
          const label = tabLabels[routeName] || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isFocused) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                accessibilityLabel={options.tabBarAccessibilityLabel || label}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.activeTabPill,
                  {
                    backgroundColor: activePillBg,
                  },
                ]}
              >
                <StyledText
                  style={{
                    color: activeContentColor,
                    fontSize: 18,
                    lineHeight: 22,
                  }}
                >
                  {icon}
                </StyledText>
                <StyledText
                  style={{
                    color: activeContentColor,
                    fontSize: 12,
                    fontWeight: '600',
                    marginLeft: 6,
                    letterSpacing: -0.2,
                  }}
                >
                  {label}
                </StyledText>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: false }}
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.inactiveTabBtn,
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <StyledText
                style={{
                  color: inactiveIconColor,
                  fontSize: 19,
                  lineHeight: 23,
                }}
              >
                {icon}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    width: '90%',
    maxWidth: 360,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 10,
  },
  activeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveTabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
