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

import { useAuthStore } from '../store/useAuthStore';
import { OfflineSyncService } from '../services/offlineSyncService';

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

/**
 * Tasarım Dokümanı (Tafsil.dc.html #1b) 'Bahçen' Okuma & Tefekkür Isı Haritası
 * 'Kaldığım Yerden Devam Et' bloğunun hemen üstünde yer alır.
 */
function BahcenCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const streak = useReadingProgressStore((s) => s.streak);
  const [todayAyahCount, setTodayAyahCount] = useState<number>(0);
  const [wateredWeeks, setWateredWeeks] = useState<number>(0);
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      OfflineSyncService.getDailyCounts(),
      OfflineSyncService.getWateredWeeksCount(),
      OfflineSyncService.getTodayReadCount(),
    ]).then(([counts, weeks, todayCnt]) => {
      if (mounted) {
        setDailyCounts(counts);
        setWateredWeeks(weeks);
        setTodayAyahCount(todayCnt);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const totalWatered = wateredWeeks > 0 ? wateredWeeks : (streak.current > 0 ? Math.max(1, Math.ceil(streak.current / 7)) : 0);
  const statusLabel = totalWatered > 0 ? `${totalWatered} haftadır sulanıyor` : 'Bugün sulanmayı bekliyor';

  // Aktif gün tespiti: Pazartesi=0, Salı=1 ... Pazar=6; en güncel hafta sütunu=15
  const todayDay = new Date().getDay();
  const todayRow = (todayDay + 6) % 7;
  const todayCol = 15;

  const days = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

  // 16 haftalık gerçek takvim matrisi: her bir (r, c) hücresinin gerçek okuma seviyesi
  const getCellTone = (r: number, c: number): string => {
    const daysDiff = (15 - c) * 7 + (todayRow - r);
    if (daysDiff < 0) {
      // Henüz yaşanmamış gelecek günler
      return theme.colors.line;
    }
    const targetDate = new Date(Date.now() - daysDiff * 86400000);
    const dateKey = targetDate.toISOString().slice(0, 10);
    const count = dailyCounts[dateKey] ?? 0;

    if (count === 0) return theme.colors.line;
    if (count < 5) return theme.colors.band;
    if (count < 10) return theme.colors.accSoft;
    return theme.colors.acc;
  };

  return (
    <Pressable
      onPress={() => navigation.navigate('ProgressMatrix')}
      style={{
        backgroundColor: theme.colors.surf,
        borderWidth: 1,
        borderColor: theme.colors.line,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <StyledText
          variant="eyebrow"
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            color: theme.colors.mut,
            fontWeight: '600',
          }}
        >
          BAHÇEN
        </StyledText>
        <StyledText variant="footnote" style={{ color: theme.colors.acc, fontSize: 12, fontWeight: '500' }}>
          {statusLabel}
        </StyledText>
      </View>

      {/* 7 Gün x 16 Hafta: Matematiksel Olarak Kusursuz Dikey Hizalı (Sütun Bazlı) Isı Haritası */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {/* Sol: 7 Gün Harfi Dikey Sütunu */}
        <View style={{ flexDirection: 'column', gap: 2.5 }}>
          {days.map((d, r) => {
            const isFriday = r === 4;
            return (
              <View
                key={r}
                style={{
                  width: 12,
                  height: 11,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <StyledText
                  style={{
                    fontSize: 9,
                    lineHeight: 11,
                    textAlign: 'center',
                    fontWeight: isFriday ? '700' : '600',
                    color: isFriday ? theme.colors.acc : theme.colors.mut,
                  }}
                >
                  {d}
                </StyledText>
              </View>
            );
          })}
        </View>

        {/* Sağ: 16 Dikey Sütun (Her sütunda 7 gün alt alta - cetvelle çizilmiş gibi hizalı) */}
        <View style={{ flex: 1, flexDirection: 'row', gap: 2.5 }}>
          {Array.from({ length: 16 }).map((_, c) => (
            <View key={c} style={{ flex: 1, flexDirection: 'column', gap: 2.5 }}>
              {days.map((_, r) => {
                const bg = getCellTone(r, c);
                const isTodayCell = r === todayRow && c === todayCol;
                return (
                  <View
                    key={r}
                    style={{
                      width: '100%',
                      height: 11,
                      borderRadius: 2,
                      backgroundColor: bg,
                      borderWidth: isTodayCell ? 1.2 : 0,
                      borderColor: isTodayCell ? theme.colors.ink : 'transparent',
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Alt Açıklama: Veritabanından çekilen gerçek okuma sayacı sağa hizalı */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 }}>
        <StyledText variant="caption" color="faint" style={{ fontSize: 11 }}>
          {todayAyahCount > 0 ? `Bugün · ${todayAyahCount} ayet okundu` : 'Bugün · 12 ayet, 3 kavram'}
        </StyledText>
      </View>
    </Pressable>
  );
}

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
        KALDIĞIN YERDEN DEVAM ET
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

function UnderstandingResumeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <Pressable
      onPress={() => navigation.navigate('UnderstandingList')}
      style={[
        styles.actionCard,
        {
          backgroundColor: theme.colors.surf,
          borderColor: theme.colors.line,
          borderWidth: 1,
          borderRadius: theme.radius.xxxl,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <StyledText variant="headline" style={{ color: theme.colors.ink }}>
            Anlama çalışmalarına dön
          </StyledText>
          <StyledText variant="footnote" color="mut" style={{ marginTop: 3 }}>
            “İlim ve cömertlik” — 4 ayet · 2 kavramlık okuma sırasına devam et
          </StyledText>
        </View>
        <StyledText variant="title" color="faint" style={{ fontSize: 20 }}>›</StyledText>
      </View>
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

function GreetingHeader() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 11
      ? 'Sabah oldu,'
      : hour < 17
        ? 'Günün aydın olsun,'
        : hour < 22
          ? 'Akşam oldu,'
          : 'Hayırlı geceler,';

  const displayName = user?.name ? user.name.split(' ')[0] : 'Kâri';

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
      <View>
        <StyledText variant="caption" color="faint">
          {timeGreeting}
        </StyledText>
        <StyledText variant="title" style={{ marginTop: 2 }}>
          {displayName}
        </StyledText>
      </View>
      <ModeBadge />
    </View>
  );
}

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [dailyCards, setDailyCards] = useState<DailyCardItem[]>(DEFAULT_DAILY_CARDS);

  useEffect(() => {
    // Canlı Fastify dashboard API'sinden günün kartlarını çek (varsa güncelle)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
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
        <GreetingHeader />

        <View style={{ gap: theme.spacing.md }}>
          {/* TASARIM DOKÜMANI: 'Kaldığım Yerden Devam Et' bloğunun hemen üstündeki BAHÇEN bloğu */}
          <BahcenCard />

          {/* AKILLI DEVAM KISAYOLLARI */}
          <ResumeCard />
          <MemorizationResumeCard />
          <UnderstandingResumeCard />

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
