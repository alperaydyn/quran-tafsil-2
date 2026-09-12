import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  SurahList: undefined;
  Memorization: undefined;
  DagExplorer: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Reading: { surahId: number; ayahNo?: number };
  MemorizationStudio: { sessionId?: string; surahId?: number; startAyah?: number; endAyah?: number };
  ProgressMatrix: { initialTab?: 'reading' | 'memorization' } | undefined;
  UnderstandingList: undefined;
  UnderstandingStudio: { id?: string; sessionId?: string; title?: string; isNew?: boolean } | undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
