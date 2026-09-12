import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useReadingProgressStore } from '../store/useReadingProgressStore';
import { useMemorizationStore } from '../store/useMemorizationStore';
import { useUserSettingsStore } from '../store/useUserSettingsStore';
import { READING_MODE_META } from '../hooks/useReadingMode';
import { mockSurahs } from '../api/mock/surahs.mock';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DailyCardItem {
  tip: string;
  baslik: string;
  sureId: number;
  sureAdiTr: string;
  ayetNo: number;
  metinAr: string;
  transliterasyonTr: string;
  mealTr: string;
  tefekkurNotu: string;
}

// Varsayılan Günün İlham Kartları (Ağ bağlantısı olmasa dahi anında gösterim)
const DEFAULT_DAILY_CARDS: DailyCardItem[] = [
  {
    tip: 'gunun_ayeti',
    baslik: 'Günün Ayeti',
    sureId: 1,
    sureAdiTr: 'Fâtiha',
    ayetNo: 5,
    metinAr: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    transliterasyonTr: "İyyâke na'budu ve iyyâke neste'în",
    mealTr: 'Yalnız Sana kulluk eder ve yalnız Senden yardım dileriz.',
    tefekkurNotu: "Kulluk ve tevhidin özü: Yalnızca O'na yönelmek ve yalnız O'ndan destek dilemek.",
  },
  {
    tip: 'gunun_duasi',
    baslik: "Günün Kur'an Duası",
    sureId: 2,
    sureAdiTr: 'Bakara',
    ayetNo: 201,
    metinAr: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliterasyonTr: 'Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr',
    mealTr: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.',
    tefekkurNotu: 'Dünya ve ahiret dengesini gözeten, esenlik ve selamet duası.',
  },
];

function ResumeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const lastRead = useReadingProgressStore((s) => s.lastRead);
  const surah = lastRead ? mockSurahs.find((s) => s.id === lastRead.surahId) : undefined;

  return (
    <Pressable
      onPress={() =>
        lastRead && navigation.navigate('Reading', { surahId: lastRead.surahId, ayahNo: lastRead.ayahNo })
      }
      disabled={!lastRead}
      style={[styles.actionCard, { backgroundColor: theme.colors.ink, borderRadius: theme.radius.xxxl }]}
    >
      <StyledText variant="eyebrow" style={{ color: theme.colors.faint }}>
        KALDIĞIM YERDEN DEVAM ET
      </StyledText>
      <StyledText variant="headline" style={{ color: theme.colors.surf, marginTop: 4 }}>
        {lastRead ? `${surah?.nameTr ?? 'Sure'} · ${lastRead.ayahNo}. ayet` : 'Henüz okumaya başlamadın'}
      </StyledText>
      {!lastRead && (
        <StyledText variant="footnote" style={{ color: theme.colors.faint, marginTop: 2 }}>
          Sureler sekmesinden bir sure seçerek başla.
        </StyledText>
      )}
    </Pressable>
  );
}

function MemorizationResumeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const getDueSessions = useMemorizationStore((s) => s.getDueSessions);
  const dueSessions = getDueSessions();

  return (
    <Pressable
      onPress={() => {
        if (dueSessions.length > 0) {
          const first = dueSessions[0];
          navigation.navigate('MemorizationStudio', {
            sessionId: first.id,
            surahId: first.surahId,
            startAyah: first.startAyah,
            endAyah: first.endAyah,
          });
        } else {
          // Ezber sekmesine git
          navigation.navigate('Main', { screen: 'Memorization' });
        }
      }}
      style={[
        styles.actionCard,
        {
          backgroundColor: theme.colors.surf,
          borderColor: dueSessions.length > 0 ? theme.colors.acc : theme.colors.line,
          borderWidth: 1,
          borderRadius: theme.radius.xxxl,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <StyledText variant="headline" style={{ color: theme.colors.ink }}>
            Ezberlemeye devam et
          </StyledText>
          <StyledText variant="footnote" color="mut" style={{ marginTop: 3 }}>
            {dueSessions.length > 0
              ? `Bugün ${dueSessions.length} bölüm hazır · yaklaşık ${dueSessions.length * 3} dk`
              : 'Aktif oturumlarını incele veya yeni bir sure ezberle'}
          </StyledText>
        </View>
        <StyledText variant="title" color="faint" style={{ fontSize: 20 }}>›</StyledText>
      </View>
    </Pressable>
  );
}

function GardenPreviewCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const readVersesBySurah = useReadingProgressStore((s) => s.readVersesBySurah);
  const sessions = useMemorizationStore((s) => s.sessions);

  const readSurahCount = Object.keys(readVersesBySurah).length;
  const memorizedSurahCount = new Set(sessions.map((s) => s.surahId)).size;

  return (
    <Pressable
      onPress={() => navigation.navigate('ProgressMatrix')}
      style={[
        styles.actionCard,
        {
          backgroundColor: theme.colors.surf,
          borderWidth: 1,
          borderColor: theme.colors.line,
          borderRadius: theme.radius.xxxl,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <StyledText variant="eyebrow" color="faint">
          OKUMA VE TEFEKKÜR BAHÇESİ
        </StyledText>
        <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
          Haritayı Aç ›
        </StyledText>
      </View>

      <StyledText variant="footnote" color="mut" style={{ lineHeight: 18 }}>
        {readSurahCount > 0 || memorizedSurahCount > 0
          ? `${readSurahCount} surede okuma, ${memorizedSurahCount} surede ezber kaydın var. 114 surelik ilerleme matrisini görmek için dokun.`
          : '114 surelik kompakt hatim ve ezber matrisi burada yer alır. Detaylı haritayı görmek için dokun.'}
      </StyledText>
    </Pressable>
  );
}

function ModeBadge() {
  const theme = useTheme();
  const readingMode = useUserSettingsStore((s) => s.readingMode);
  const meta = READING_MODE_META[readingMode];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.accSoft,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <StyledText variant="caption" color="acc">
        {meta.title.toLocaleUpperCase('tr-TR')} MODU
      </StyledText>
    </View>
  );
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [dailyCards, setDailyCards] = useState<DailyCardItem[]>(DEFAULT_DAILY_CARDS);

  useEffect(() => {
    // Canlı Fastify dashboard API'sinden günün kartlarını çek (varsa güncelle)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    fetch(`${apiUrl}/dashboard/gunun-kartlari`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDailyCards(json.data);
        }
      })
      .catch(() => {
        // Fallback: DEFAULT_DAILY_CARDS zaten aktif
      });
  }, []);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={{ marginTop: 12, marginBottom: 16, gap: 8 }}>
          <ModeBadge />
          <StyledText variant="title">Selam.</StyledText>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <ResumeCard />
          <MemorizationResumeCard />
          <GardenPreviewCard />

          {/* GÜNÜN İLHAM KARTLARI */}
          <View style={{ marginTop: 10, gap: 12 }}>
            <StyledText variant="eyebrow" color="faint">
              GÜNÜN İLHAM KARTLARI
            </StyledText>

            {dailyCards.map((card, idx) => (
              <Pressable
                key={idx}
                onPress={() =>
                  navigation.navigate('Reading', { surahId: card.sureId, ayahNo: card.ayetNo })
                }
                style={[
                  styles.dailyCard,
                  {
                    backgroundColor: theme.colors.surf,
                    borderColor: theme.colors.line,
                    borderRadius: theme.radius.xxl,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StyledText variant="eyebrow" color="acc">
                    {card.baslik.toLocaleUpperCase('tr-TR')}
                  </StyledText>
                  <StyledText variant="caption" color="mut">
                    {card.sureAdiTr} · {card.ayetNo}
                  </StyledText>
                </View>

                <StyledText
                  style={{
                    fontFamily: 'Amiri',
                    fontSize: 22,
                    lineHeight: 38,
                    textAlign: 'right',
                    color: theme.colors.ink,
                    marginVertical: 4,
                  }}
                >
                  {card.metinAr}
                </StyledText>

                <StyledText variant="footnote" color="ink" style={{ lineHeight: 19 }}>
                  {card.mealTr}
                </StyledText>

                <StyledText variant="caption" color="faint" style={{ marginTop: 2, fontStyle: 'italic' }}>
                  {card.tefekkurNotu}
                </StyledText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    padding: 18,
  },
  dailyCard: {
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
});
