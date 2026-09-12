import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'UnderstandingStudio'>;

export function UnderstandingStudioScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();

  const title = route.params?.title || 'İlim ve cömertlik';
  const [activeTab, setActiveTab] = useState<'run' | 'queue'>('queue');
  const [questionInput, setQuestionInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [splitOffer, setSplitOffer] = useState<{
    visible: boolean;
    title: string;
    reason: string;
  } | null>(null);

  const steps = [
    {
      title: 'Kavramlar ayrıştırılıyor',
      sub: 'Alak, İlim, İnfak, Cömertlik semantik ağına bağlanıldı',
      done: true,
    },
    {
      title: 'İlgili ayetler taranıyor',
      sub: 'Alak 1..5, Rahman 1..4, Bakara 31 kronolojik sırayla kümelendi',
      done: true,
    },
    {
      title: 'Özet ve okuma rotası oluşturuldu',
      sub: '5 ayetlik rehberli okuma sıralaması hazırlandı',
      done: true,
    },
  ];

  const queue = [
    {
      n: 1,
      ref: 'Alak 1..5',
      st: 'Nüzul 1 · Erken Mekke',
      why: 'Öğretmenin bir cömertlik fiili olarak kurulduğu ilk nirengi noktası',
      read: true,
    },
    {
      n: 2,
      ref: 'Rahman 1..4',
      st: 'Nüzul 97 · Erken Mekke',
      why: 'Rahmân sıfatı ve Kur\'an\'ı öğretmenin insana en büyük ikram oluşu',
      read: true,
    },
    {
      n: 3,
      ref: 'Bakara 31..33',
      st: 'Nüzul 87 · Medine',
      why: 'İsimlerin öğretilmesi: bilginin emanet ve halifelik sorumluluğu boyutu',
      read: false,
    },
    {
      n: 4,
      ref: 'Fatır 28',
      st: 'Nüzul 43 · Orta Mekke',
      why: 'Kulları içinde Allah\'tan ancak âlimlerin haşyet duyacağı takva bağı',
      read: false,
    },
    {
      n: 5,
      ref: 'Kalem 1',
      st: 'Nüzul 2 · Erken Mekke',
      why: 'Kaleme ve yazdıklarına yemin: bilginin kaydı ve yayılması',
      read: false,
    },
  ];

  const handleSendQuestion = () => {
    if (!questionInput.trim()) return;

    const q = questionInput.trim();
    setQuestionInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);

    // Intent Branching simülasyonu (Tafsil.dc.html #13)
    if (q.toLowerCase().includes('sabır') || q.toLowerCase().includes('sabr')) {
      setSplitOffer({
        visible: true,
        title: 'Sabır ayetleri',
        reason: 'Sabır, bu çalışmadaki kavramlarla kesişmiyor. Ayrı bir çalışma açarsam ikisi de kendi okuma sırasını korur.',
      });
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Bu soru mevcut çalışmanın içinde kalıyor. Kalemle öğretmek ve ilmin cömertlikle bağı bağlamında okuma sırasına 68:1 (Kalem 1) güçlendirilerek eklendi.`,
          },
        ]);
      }, 350);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Üst Bar (Tafsil.dc.html #12) */}
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
        <View style={{ alignItems: 'center' }}>
          <StyledText variant="headline" color="ink">
            {title}
          </StyledText>
          <StyledText
            variant="caption"
            color="acc"
            style={{ letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10, marginTop: 1 }}
          >
            ÇALIŞMA · 3 GÜNDÜR AÇIK
          </StyledText>
        </View>
        <StyledText variant="body" color="mut">
          ↗
        </StyledText>
      </View>

      {/* Görünüm Değiştirici: Toplanıyor ↔ Özet ve Okuma Sırası */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.band,
            borderRadius: theme.radius.md,
            padding: 3,
            gap: 2,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('run')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              backgroundColor: activeTab === 'run' ? theme.colors.surf : 'transparent',
              alignItems: 'center',
            }}
          >
            <StyledText
              variant="caption"
              color={activeTab === 'run' ? 'ink' : 'mut'}
              style={{ fontWeight: activeTab === 'run' ? '600' : '400' }}
            >
              Toplanıyor
            </StyledText>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('queue')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              backgroundColor: activeTab === 'queue' ? theme.colors.surf : 'transparent',
              alignItems: 'center',
            }}
          >
            <StyledText
              variant="caption"
              color={activeTab === 'queue' ? 'ink' : 'mut'}
              style={{ fontWeight: activeTab === 'queue' ? '600' : '400' }}
            >
              Özet ve okuma sırası
            </StyledText>
          </Pressable>
        </View>
      </View>

      {/* İçerik */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: 36,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'run' ? (
          /* Toplanıyor / Canlı Timeline Aşamaları */
          <View style={{ gap: theme.spacing.md }}>
            <View
              style={{
                backgroundColor: theme.colors.surf,
                borderWidth: 1,
                borderColor: theme.colors.line,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                gap: 4,
              }}
            >
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                SORDUĞUN
              </StyledText>
              <StyledText
                variant="bodyLarge"
                color="ink"
                style={{ fontFamily: theme.font.serif, fontSize: 16, lineHeight: 23 }}
              >
                “İlmin cömertlikle ilişkisi nedir, Kur'an bunu nerede kuruyor?”
              </StyledText>
            </View>

            <View style={{ gap: 14, marginTop: 6 }}>
              {steps.map((st, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center', width: 16 }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: theme.colors.acc,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StyledText variant="caption" color="surf" style={{ fontSize: 9 }}>
                        ✓
                      </StyledText>
                    </View>
                    {idx < steps.length - 1 && (
                      <View style={{ width: 1.5, flex: 1, backgroundColor: theme.colors.line, marginTop: 3 }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 10 }}>
                    <StyledText variant="headline" color="ink" style={{ fontSize: 13 }}>
                      {st.title}
                    </StyledText>
                    <StyledText variant="caption" color="mut" style={{ marginTop: 2, lineHeight: 16 }}>
                      {st.sub}
                    </StyledText>
                  </View>
                </View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: theme.colors.accSoft,
                borderRadius: theme.radius.lg,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <StyledText variant="headline" color="acc">
                ◴
              </StyledText>
              <StyledText variant="caption" color="ink" style={{ flex: 1, lineHeight: 16 }}>
                Özet hazırlandı ve okuma rotası oluşturuldu. Aşağıdaki sekmeden okuma sırasına geçebilirsin.
              </StyledText>
            </View>
          </View>
        ) : (
          /* Özet ve Okuma Sırası */
          <View style={{ gap: theme.spacing.md }}>
            {/* Sentez Özeti Kartı */}
            <View
              style={{
                backgroundColor: theme.colors.surf,
                borderWidth: 1,
                borderColor: theme.colors.line,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                gap: 8,
              }}
            >
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                ÖZET SENTEZ
              </StyledText>
              <StyledText
                variant="bodyLarge"
                color="ink"
                style={{ fontFamily: theme.font.serif, fontSize: 16, lineHeight: 25 }}
              >
                Kur'an öğretmeyi bir cömertlik fiili olarak kuruyor: Alak'ta “Rabbin en cömert olandır” cümlesinin hemen ardından kalemle öğretmekten söz edilir. Bilgi, sahip olunan bir mülk değil, verilen bir ikramdır.
              </StyledText>
              <StyledText
                variant="body"
                color="mut"
                style={{ fontFamily: theme.font.serif, fontSize: 14.5, lineHeight: 22 }}
              >
                Aynı bağ Rahman'da tekrar kurulur; Bakara'da isimlerin öğretilmesi bu ikramın ilk örneğidir. Karşı kutupta, öğrendiğini kendinden sayan tavır tuğyan olarak anılır.
              </StyledText>

              {/* Kavram Etiketleri */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {['#ilim', '#cömertlik', '#rahmet', '#öğretme'].map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: theme.colors.band,
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <StyledText variant="caption" color="mut" style={{ fontSize: 11 }}>
                      {tag}
                    </StyledText>
                  </View>
                ))}
              </View>
            </View>

            {/* Okuma Sırası Başlığı */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <StyledText variant="caption" color="faint" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                OKUMA SIRASI
              </StyledText>
              <StyledText variant="caption" color="acc" style={{ fontWeight: '600' }}>
                2 / 5 okundu
              </StyledText>
            </View>
            <StyledText variant="caption" color="mut" style={{ marginTop: -8 }}>
              Sırayla oku; her ayetten bu çalışmaya geri dönersin.
            </StyledText>

            {/* Kuyruktaki Ayet Kartları */}
            <View style={{ gap: 8 }}>
              {queue.map((item) => (
                <View
                  key={item.n}
                  style={{
                    backgroundColor: theme.colors.surf,
                    borderWidth: 1,
                    borderColor: theme.colors.line,
                    borderRadius: theme.radius.md,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: item.read ? theme.colors.accSoft : theme.colors.band,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StyledText
                      variant="caption"
                      color={item.read ? 'acc' : 'mut'}
                      style={{ fontWeight: '700', fontSize: 11 }}
                    >
                      {item.n}
                    </StyledText>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                      <StyledText variant="headline" color="ink" style={{ fontSize: 13.5 }}>
                        {item.ref}
                      </StyledText>
                      <StyledText variant="caption" color="faint" style={{ fontSize: 10.5 }}>
                        {item.st}
                      </StyledText>
                    </View>
                    <StyledText variant="caption" color="mut" style={{ marginTop: 2, lineHeight: 16 }}>
                      {item.why}
                    </StyledText>
                  </View>

                  <StyledText variant="headline" color="faint">
                    ›
                  </StyledText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ek Soru Mesajlaşma Geçmişi (Tafsil.dc.html #13) */}
        {messages.length > 0 && (
          <View style={{ gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 12 }}>
            {messages.map((m, idx) => (
              <View
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: m.role === 'user' ? theme.colors.ink : theme.colors.surf,
                  borderRadius: theme.radius.lg,
                  padding: 12,
                  borderWidth: m.role === 'user' ? 0 : 1,
                  borderColor: theme.colors.line,
                }}
              >
                <StyledText
                  variant={m.role === 'user' ? 'caption' : 'footnote'}
                  color={m.role === 'user' ? 'surf' : 'ink'}
                  style={{
                    fontFamily: m.role === 'user' ? undefined : theme.font.serif,
                    fontSize: 13.5,
                    lineHeight: 20,
                  }}
                >
                  {m.text}
                </StyledText>
              </View>
            ))}
          </View>
        )}

        {/* Intent Branching Teklif Kartı (Tafsil.dc.html #13 anSplitOpen) */}
        {splitOffer?.visible && (
          <View
            style={{
              backgroundColor: theme.colors.accSoft,
              borderRadius: theme.radius.lg,
              padding: 14,
              gap: 8,
              marginTop: 10,
            }}
          >
            <StyledText variant="caption" color="acc" style={{ letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' }}>
              BU SORU BAŞKA BİR KONU
            </StyledText>
            <StyledText
              variant="body"
              color="ink"
              style={{ fontFamily: theme.font.serif, fontSize: 14.5, lineHeight: 22 }}
            >
              {splitOffer.reason}
            </StyledText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Button
                label="Yeni çalışma aç"
                variant="primary"
                onPress={() => {
                  setSplitOffer(null);
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      text: `Yeni bir çalışma başlatıldı: "${splitOffer.title}". Sabır ve metanet ayetleri derleniyor.`,
                    },
                  ]);
                }}
                style={{ flex: 1, height: 38 }}
              />
              <Button
                label="Burada kalsın"
                variant="secondary"
                onPress={() => {
                  setSplitOffer(null);
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: 'assistant',
                      text: `Tamam, bu çalışmada kalıyor. Sabır ayetleri okuma sırasının sonuna ek bölüm olarak bağlandı.`,
                    },
                  ]);
                }}
                style={{ flex: 1, height: 38 }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Alt Soru Sorma Çubuğu (Tafsil.dc.html #12 & #13) */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.line,
          backgroundColor: theme.colors.surf,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TextInput
          value={questionInput}
          onChangeText={setQuestionInput}
          placeholder="Bu çalışmaya soru ekle…"
          placeholderTextColor={theme.colors.mut}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.band,
            paddingHorizontal: 16,
            fontSize: 13,
            color: theme.colors.ink,
          }}
          onSubmitEditing={handleSendQuestion}
        />
        <Pressable
          onPress={handleSendQuestion}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StyledText variant="headline" color="surf" style={{ fontSize: 17, lineHeight: 20 }}>
            ↑
          </StyledText>
        </Pressable>
      </View>
    </Screen>
  );
}
