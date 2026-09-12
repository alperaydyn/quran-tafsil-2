import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useMemorizationStore, type LocalMemorizationSession } from '../store/useMemorizationStore';
import { NewSessionModal } from '../components/memorization/NewSessionModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MemorizationListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const sessions = useMemorizationStore((s) => s.sessions);
  const getDueSessions = useMemorizationStore((s) => s.getDueSessions);
  const setActiveSessionId = useMemorizationStore((s) => s.setActiveSessionId);

  const [modalVisible, setModalVisible] = useState(false);
  const dueSessions = getDueSessions();

  const handleStartSession = (session: LocalMemorizationSession) => {
    setActiveSessionId(session.id);
    navigation.navigate('MemorizationStudio', {
      sessionId: session.id,
      surahId: session.surahId,
      startAyah: session.startAyah,
      endAyah: session.endAyah,
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Üst Çubuk */}
        <View style={styles.navBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <StyledText variant="title" color="mut" style={{ fontSize: 24 }}>‹</StyledText>
          </Pressable>
          <StyledText variant="headline" style={{ color: theme.colors.ink, fontSize: 17 }}>
            Ezber Oturumları
          </StyledText>
          <StyledText variant="body" color="mut">⋯</StyledText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Bugün Tekrar Bekleyenler Bildirim Kartı */}
          {dueSessions.length > 0 ? (
            <View
              style={[
                styles.dueCard,
                { backgroundColor: theme.colors.accSoft, borderColor: theme.colors.acc, borderWidth: 0.5 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <StyledText variant="callout" color="acc" style={{ fontWeight: '600' }}>
                  Bugün {dueSessions.length} bölüm tekrar bekliyor
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ marginTop: 3 }}>
                  {dueSessions.map((d) => `${d.surahNameTr} ${d.startAyah}–${d.endAyah}`).slice(0, 2).join(' · ')}
                  {' — yaklaşık 6 dk'}
                </StyledText>
              </View>

              <Pressable
                onPress={() => handleStartSession(dueSessions[0])}
                style={[styles.dueStartBtn, { backgroundColor: theme.colors.acc }]}
              >
                <StyledText variant="caption" style={{ color: theme.colors.surf, fontWeight: '600' }}>
                  Başla
                </StyledText>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.dueCard,
                { backgroundColor: theme.colors.surf, borderColor: theme.colors.line, borderWidth: 1 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <StyledText variant="callout" style={{ color: theme.colors.ink, fontWeight: '600' }}>
                  Tüm tekrarlar güncel!
                </StyledText>
                <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                  Harika gidiyorsun. Bugün için vadesi dolan ezber tekrarın bulunmuyor.
                </StyledText>
              </View>
            </View>
          )}

          {/* Bölüm Başlığı */}
          <View style={styles.sectionHeader}>
            <StyledText variant="eyebrow" color="faint">AKTİF OTURUMLAR</StyledText>
            <StyledText variant="caption" color="mut">{sessions.length} oturum</StyledText>
          </View>

          {/* Oturum Kartları */}
          <View style={{ gap: 12 }}>
            {sessions.map((session) => {
              const totalAyahs = session.endAyah - session.startAyah + 1;
              const isDue = session.nextReviewAt <= new Date().toISOString();

              return (
                <Pressable
                  key={session.id}
                  onPress={() => handleStartSession(session)}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: theme.colors.surf,
                      borderColor: isDue ? theme.colors.acc : theme.colors.line,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <StyledText variant="headline" style={{ color: theme.colors.ink }}>
                        {session.surahId} · {session.surahNameTr}
                      </StyledText>
                      <StyledText variant="footnote" color="faint" style={{ marginTop: 2 }}>
                        Ayet {session.startAyah}–{session.endAyah} · {totalAyahs} ayet
                      </StyledText>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor:
                              session.status === 'pekistirildi'
                                ? theme.colors.accSoft
                                : isDue
                                ? theme.colors.band
                                : theme.colors.surf,
                            borderColor: isDue ? theme.colors.acc : theme.colors.line,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <StyledText
                          variant="caption"
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: session.status === 'pekistirildi' ? theme.colors.acc : theme.colors.ink,
                          }}
                        >
                          {isDue
                            ? 'Tekrar Zamanı'
                            : session.status === 'pekistirildi'
                            ? 'Pekiştirildi'
                            : `${session.intervalDays} gün sonra`}
                        </StyledText>
                      </View>
                    </View>
                  </View>

                  {/* İnce ilerleme çizgisi */}
                  <View style={[styles.progressTrack, { backgroundColor: theme.colors.line }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(15, session.repetitionNumber * 25))}%`,
                          backgroundColor: session.status === 'pekistirildi' ? theme.colors.ink : theme.colors.acc,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <StyledText variant="footnote" color="mut">
                      {session.theme || 'Ezber Çalışması'}
                    </StyledText>
                    <StyledText variant="caption" color="faint">
                      {session.totalToursCompleted ?? 0} tur tamamlandı
                    </StyledText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Alt Çubuk: Yeni Oturum */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surf, borderTopColor: theme.colors.line }]}>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.createBtn, { backgroundColor: theme.colors.ink }]}
          >
            <StyledText variant="callout" style={{ color: theme.colors.surf, fontWeight: '600' }}>
              Yeni ezber oturumu
            </StyledText>
          </Pressable>
        </View>

        {/* Yeni Oturum Kurulum Modalı */}
        <NewSessionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSessionCreated={(newId) => {
            const newSession = sessions.find((s) => s.id === newId);
            if (newSession) handleStartSession(newSession);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 12,
  },
  dueStartBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  createBtn: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
