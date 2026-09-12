import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { ShareStudyModal } from '../components/sharing/ShareStudyModal';

interface StudyItem {
  id: string;
  title: string;
  question: string;
  badge: string;
  meta: string;
  pinned: boolean;
}

const INITIAL_STUDIES: StudyItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'İlim ve cömertlik',
    question: 'İlmin cömertlikle ilişkisi nedir, Kur\'an bunu nerede kuruyor?',
    badge: '4 ayet · 2 kavram',
    meta: '3 gündür açık · Nüzul 1 öncelikli',
    pinned: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Sabır ve şükür dengesi',
    question: 'Sabır ile şükür arasındaki dinamik denge nerede kuruluyor?',
    badge: '3 ayet · 3 kavram',
    meta: 'Dün tamamlandı',
    pinned: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Adalet ve ihsan',
    question: 'Adalet ile ihsan arasındaki ahlaki fark ve Kur\'ani mizan',
    badge: '5 ayet · 2 kavram',
    meta: '1 hafta önce',
    pinned: false,
  },
];

export function UnderstandingListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [studies, setStudies] = useState<StudyItem[]>(INITIAL_STUDIES);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);

  const pinned = studies.filter((s) => s.pinned);
  const allOthers = studies.filter((s) => !s.pinned);

  const togglePin = (id: string) => {
    setStudies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
    );
  };

  const handleOpenStudy = (study: StudyItem) => {
    navigation.navigate('UnderstandingStudio', { sessionId: study.id, title: study.title });
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Üst Bar (Tafsil.dc.html #11) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.line,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <StyledText variant="title" color="mut">
            ‹
          </StyledText>
        </Pressable>
        <StyledText variant="headline" color="ink">
          Anlama çalışmaları
        </StyledText>
        <StyledText variant="headline" color="mut">
          ⋯
        </StyledText>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: 36,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Soru Başlatma Hero Kartı */}
        <View
          style={{
            backgroundColor: theme.colors.surf,
            borderWidth: 1,
            borderColor: theme.colors.line,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            gap: 12,
          }}
        >
          <StyledText
            variant="bodyLarge"
            color="mut"
            style={{ fontFamily: theme.font.serif, lineHeight: 22 }}
          >
            Bir soru yaz — ilgili kavramları, sureleri ve ayetleri bir araya getirip sana okuma sırası hazırlarım.
          </StyledText>
          <Button
            label="Yeni çalışma başlat"
            variant="primary"
            onPress={() => navigation.navigate('UnderstandingStudio', { isNew: true })}
            style={{ borderRadius: 21, height: 42 }}
          />
        </View>

        {/* Sabitlenenler Bölümü */}
        {pinned.length > 0 ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                SABİTLENENLER
              </StyledText>
              <StyledText variant="caption" color="mut">
                {pinned.length}
              </StyledText>
            </View>

            {pinned.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleOpenStudy(item)}
                style={({ pressed }) => ({
                  backgroundColor: theme.colors.surf,
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.md,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <StyledText variant="headline" color="ink" style={{ fontFamily: theme.font.serif, fontSize: 17 }}>
                      {item.title}
                    </StyledText>
                    <StyledText variant="caption" color="mut" style={{ marginTop: 4, lineHeight: 16 }}>
                      {item.question}
                    </StyledText>
                  </View>
                  <Pressable onPress={() => togglePin(item.id)} hitSlop={8} style={{ paddingLeft: 8 }}>
                    <StyledText variant="caption" color="acc">
                      ★
                    </StyledText>
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <View style={{ backgroundColor: theme.colors.accSoft, borderRadius: theme.radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <StyledText variant="caption" color="acc" style={{ fontSize: 11, fontWeight: '600' }}>
                      {item.badge}
                    </StyledText>
                  </View>
                  <StyledText variant="caption" color="faint" style={{ flex: 1, fontSize: 11 }}>
                    {item.meta}
                  </StyledText>
                  <Pressable
                    onPress={() => {
                      setSelectedStudy(item);
                      setShareSheetVisible(true);
                    }}
                    hitSlop={8}
                  >
                    <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                      Paylaş
                    </StyledText>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Tüm Çalışmalar */}
        <View style={{ gap: 8, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              TÜM ÇALIŞMALAR
            </StyledText>
            <StyledText variant="caption" color="mut">
              {allOthers.length}
            </StyledText>
          </View>

          {allOthers.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpenStudy(item)}
              style={({ pressed }) => ({
                backgroundColor: theme.colors.surf,
                borderWidth: 1,
                borderColor: theme.colors.line,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <StyledText variant="headline" color="ink" style={{ fontFamily: theme.font.serif, fontSize: 17 }}>
                    {item.title}
                  </StyledText>
                  <StyledText variant="caption" color="mut" style={{ marginTop: 4, lineHeight: 16 }}>
                    {item.question}
                  </StyledText>
                </View>
                <Pressable onPress={() => togglePin(item.id)} hitSlop={8} style={{ paddingLeft: 8 }}>
                  <StyledText variant="caption" color="faint">
                    ☆
                  </StyledText>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <View style={{ backgroundColor: theme.colors.band, borderRadius: theme.radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <StyledText variant="caption" color="mut" style={{ fontSize: 11, fontWeight: '500' }}>
                    {item.badge}
                  </StyledText>
                </View>
                <StyledText variant="caption" color="faint" style={{ flex: 1, fontSize: 11 }}>
                  {item.meta}
                </StyledText>
                <Pressable
                  onPress={() => {
                    setSelectedStudy(item);
                    setShareSheetVisible(true);
                  }}
                  hitSlop={8}
                >
                  <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                    Paylaş
                  </StyledText>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Paylaşım Alt Çekmecesi (Tafsil.dc.html #11 anShareOpen) */}
      <ShareStudyModal
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        study={selectedStudy}
      />
    </Screen>
  );
}
