import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Screen } from '../components/common/Screen';
import { StyledText } from '../components/common/StyledText';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme';

interface DagNode {
  id: string;
  slug: string;
  label: string;
  arabic: string;
  relType: 'merkez' | 'kapsama' | 'sebep_sonuc' | 'iliskili' | 'zit_anlam';
  relationLabel: string;
  meta: string;
}

const DEFAULT_NODES: DagNode[] = [
  {
    id: '1',
    slug: 'ilim',
    label: 'İlim',
    arabic: 'العلم',
    relType: 'merkez',
    relationLabel: 'Merkez Düğüm',
    meta: 'Alak 1..5, Bakara 31 · 14 doğrudan bağ',
  },
  {
    id: '2',
    slug: 'hikmet',
    label: 'Hikmet',
    arabic: 'الحكمة',
    relType: 'kapsama',
    relationLabel: 'Kapsama',
    meta: 'Bakara 269 · Bilginin amel ile birleştiği nokta',
  },
  {
    id: '3',
    slug: 'takva',
    label: 'Takva',
    arabic: 'التقوى',
    relType: 'iliskili',
    relationLabel: 'İlişkili',
    meta: 'Fatır 28 · Sorumluluk bilinci ve haşyet',
  },
  {
    id: '4',
    slug: 'iman',
    label: 'İman',
    arabic: 'الإيمان',
    relType: 'sebep_sonuc',
    relationLabel: 'Sebep-Sonuç',
    meta: 'Hucurat 14 · Delile dayalı tasdik ve teslimiyet',
  },
  {
    id: '5',
    slug: 'infak',
    label: 'İnfak & Cömertlik',
    arabic: 'الإنفاق',
    relType: 'sebep_sonuc',
    relationLabel: 'Sebep-Sonuç',
    meta: 'Alak 3..4 · İlmin ve nimetin cömertçe paylaşımı',
  },
  {
    id: '6',
    slug: 'ihsan',
    label: 'İhsan',
    arabic: 'الإحسان',
    relType: 'iliskili',
    relationLabel: 'İlişkili',
    meta: 'Nahl 90 · İşini en güzel biçimde yapma şuuru',
  },
  {
    id: '7',
    slug: 'adalet',
    label: 'Adalet',
    arabic: 'العدل',
    relType: 'sebep_sonuc',
    relationLabel: 'Sebep-Sonuç',
    meta: 'Maide 8 · Mizanı korumak ve istikamet',
  },
  {
    id: '8',
    slug: 'zulum',
    label: 'Zulüm',
    arabic: 'الظلم',
    relType: 'zit_anlam',
    relationLabel: 'Zıt Anlam',
    meta: 'Bakara 165 · Haddi aşmak ve dengeyi ifsat etmek',
  },
];

export function DagExplorerScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph');
  const [filterTag, setFilterTag] = useState<'benim' | 'topluluk' | 'paylasilan'>('benim');
  const [selectedNode, setSelectedNode] = useState<DagNode>(DEFAULT_NODES[0]);
  const [timelineVisible, setTimelineVisible] = useState(false);

  // İlişki türüne göre gruplama (Liste Görünümü için)
  const groupedRelations = [
    {
      kind: 'Kapsama İlişkisi',
      color: theme.colors.acc,
      items: DEFAULT_NODES.filter((n) => n.relType === 'kapsama'),
    },
    {
      kind: 'Sebep-Sonuç İlişkisi',
      color: '#4A8256',
      items: DEFAULT_NODES.filter((n) => n.relType === 'sebep_sonuc'),
    },
    {
      kind: 'İlişkili Kavramlar',
      color: '#B08836',
      items: DEFAULT_NODES.filter((n) => n.relType === 'iliskili'),
    },
    {
      kind: 'Zıt Anlamlılar',
      color: '#A84848',
      items: DEFAULT_NODES.filter((n) => n.relType === 'zit_anlam'),
    },
  ];

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Üst Başlık Barı (Tafsil.dc.html #05) */}
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
        <StyledText variant="title" color="mut">
          ‹
        </StyledText>
        <View style={{ alignItems: 'center' }}>
          <StyledText variant="headline" color="ink">
            {selectedNode.label.toUpperCase()} ağı
          </StyledText>
          <StyledText
            variant="caption"
            color="faint"
            style={{ letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10, marginTop: 1 }}
          >
            SENİN AĞIN · 14 KAVRAM
          </StyledText>
        </View>
        <StyledText variant="headline" color="mut">
          ⋯
        </StyledText>
      </View>

      {/* Ağ ↔ Liste Sekme Seçici */}
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
            onPress={() => setActiveTab('graph')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              backgroundColor: activeTab === 'graph' ? theme.colors.surf : 'transparent',
              alignItems: 'center',
            }}
          >
            <StyledText
              variant="caption"
              color={activeTab === 'graph' ? 'ink' : 'mut'}
              style={{ fontWeight: activeTab === 'graph' ? '600' : '400' }}
            >
              Ağ (Graf)
            </StyledText>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('list')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.radius.sm,
              backgroundColor: activeTab === 'list' ? theme.colors.surf : 'transparent',
              alignItems: 'center',
            }}
          >
            <StyledText
              variant="caption"
              color={activeTab === 'list' ? 'ink' : 'mut'}
              style={{ fontWeight: activeTab === 'list' ? '600' : '400' }}
            >
              Liste
            </StyledText>
          </Pressable>
        </View>
      </View>

      {/* Filtre Etiketleri (Benim / Topluluk / Paylaşılan) */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        }}
      >
        {(['benim', 'topluluk', 'paylasilan'] as const).map((tag) => (
          <Pressable
            key={tag}
            onPress={() => setFilterTag(tag)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: theme.radius.sm,
              backgroundColor: filterTag === tag ? theme.colors.ink : theme.colors.band,
            }}
          >
            <StyledText
              variant="caption"
              color={filterTag === tag ? 'surf' : 'mut'}
              style={{
                textTransform: 'capitalize',
                fontWeight: filterTag === tag ? '600' : '400',
              }}
            >
              {tag === 'benim' ? 'Benim' : tag === 'topluluk' ? 'Topluluk' : 'Paylaşılan'}
            </StyledText>
          </Pressable>
        ))}
      </View>

      {/* Ana İçerik: Graf Görünümü veya Liste Görünümü */}
      <View style={{ flex: 1 }}>
        {activeTab === 'graph' ? (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.surf,
              borderTopWidth: 1,
              borderTopColor: theme.colors.line,
              padding: theme.spacing.lg,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Merkez Düğüm */}
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: theme.colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <StyledText variant="arabicReading" color="surf" style={{ fontSize: 22, lineHeight: 28, writingDirection: 'rtl' }}>
                {selectedNode.arabic}
              </StyledText>
              <StyledText variant="headline" color="surf" style={{ fontWeight: '600', fontSize: 15 }}>
                {selectedNode.label}
              </StyledText>
              <StyledText variant="caption" color="faint" style={{ fontSize: 9 }}>
                MERKEZ
              </StyledText>
            </View>

            {/* Çevre Düğümler Grid / Uydu Dizilimi */}
            <View
              style={{
                position: 'absolute',
                top: 20,
                bottom: 20,
                left: 20,
                right: 20,
                justifyContent: 'space-between',
              }}
            >
              {/* Üst Düğümler */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[DEFAULT_NODES[1], DEFAULT_NODES[2]].map((node) => (
                  <Pressable
                    key={node.id}
                    onPress={() => setSelectedNode(node)}
                    style={({ pressed }) => ({
                      backgroundColor: selectedNode.id === node.id ? theme.colors.accSoft : theme.colors.surf,
                      borderWidth: 1.5,
                      borderColor: selectedNode.id === node.id ? theme.colors.acc : theme.colors.line,
                      borderRadius: theme.radius.lg,
                      padding: 10,
                      alignItems: 'center',
                      minWidth: 105,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <StyledText variant="caption" color="acc" style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                      {node.relationLabel}
                    </StyledText>
                    <StyledText variant="headline" color="ink" style={{ fontSize: 13, marginTop: 2 }}>
                      {node.label}
                    </StyledText>
                    <StyledText variant="caption" color="mut" style={{ fontSize: 11, writingDirection: 'rtl' }}>
                      {node.arabic}
                    </StyledText>
                  </Pressable>
                ))}
              </View>

              {/* Orta Yan Düğümler */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {[DEFAULT_NODES[3], DEFAULT_NODES[4]].map((node) => (
                  <Pressable
                    key={node.id}
                    onPress={() => setSelectedNode(node)}
                    style={({ pressed }) => ({
                      backgroundColor: selectedNode.id === node.id ? theme.colors.accSoft : theme.colors.surf,
                      borderWidth: 1.5,
                      borderColor: selectedNode.id === node.id ? theme.colors.acc : theme.colors.line,
                      borderRadius: theme.radius.lg,
                      padding: 10,
                      alignItems: 'center',
                      minWidth: 105,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <StyledText variant="caption" color="acc" style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                      {node.relationLabel}
                    </StyledText>
                    <StyledText variant="headline" color="ink" style={{ fontSize: 13, marginTop: 2 }}>
                      {node.label}
                    </StyledText>
                    <StyledText variant="caption" color="mut" style={{ fontSize: 11, writingDirection: 'rtl' }}>
                      {node.arabic}
                    </StyledText>
                  </Pressable>
                ))}
              </View>

              {/* Alt Düğümler */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[DEFAULT_NODES[5], DEFAULT_NODES[6], DEFAULT_NODES[7]].map((node) => (
                  <Pressable
                    key={node.id}
                    onPress={() => setSelectedNode(node)}
                    style={({ pressed }) => ({
                      backgroundColor: selectedNode.id === node.id ? theme.colors.accSoft : theme.colors.surf,
                      borderWidth: 1.5,
                      borderColor: selectedNode.id === node.id ? theme.colors.acc : theme.colors.line,
                      borderRadius: theme.radius.lg,
                      padding: 8,
                      alignItems: 'center',
                      minWidth: 90,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <StyledText variant="caption" color="acc" style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>
                      {node.relationLabel}
                    </StyledText>
                    <StyledText variant="headline" color="ink" style={{ fontSize: 12, marginTop: 2 }}>
                      {node.label}
                    </StyledText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Seçili Düğüm İpucu Şeridi */}
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: theme.radius.md,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: theme.colors.line,
              }}
            >
              <StyledText variant="footnote" color="mut" style={{ fontSize: 11.5 }}>
                Düğüme dokunarak merkez yapabilir veya ilişkileri inceleyebilirsin.
              </StyledText>
            </View>
          </View>
        ) : (
          /* Liste Görünümü (Tafsil.dc.html #05 lTab) */
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.sm,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {groupedRelations.map((group, gIdx) => (
              <View key={`group-${gIdx}`} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: group.color }} />
                  <StyledText
                    variant="caption"
                    color="mut"
                    style={{ letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' }}
                  >
                    {group.kind}
                  </StyledText>
                </View>

                <View style={{ gap: 10 }}>
                  {group.items.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedNode(item)}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 4,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <StyledText variant="headline" color="ink" style={{ fontFamily: theme.font.serif, fontSize: 16 }}>
                          {item.label} <StyledText variant="footnote" color="mut">({item.arabic})</StyledText>
                        </StyledText>
                        <StyledText variant="caption" color="mut" style={{ marginTop: 2 }}>
                          {item.meta}
                        </StyledText>
                      </View>
                      <StyledText variant="headline" color="faint">
                        ›
                      </StyledText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Alt Eylem Barı: Nüzul Zaman Tüneli & Ekle */}
      <View
        style={{
          height: 66,
          borderTopWidth: 1,
          borderTopColor: theme.colors.line,
          backgroundColor: theme.colors.surf,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Button
          label="Nüzul zaman tüneli"
          variant="secondary"
          onPress={() => setTimelineVisible(true)}
          style={{ flex: 1, height: 42, borderRadius: 21 }}
        />
        <Pressable
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StyledText variant="headline" color="surf" style={{ fontSize: 18, lineHeight: 22 }}>
            +
          </StyledText>
        </Pressable>
      </View>

      {/* Nüzul Zaman Tüneli Modalı */}
      <Modal visible={timelineVisible} transparent animationType="slide" onRequestClose={() => setTimelineVisible(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setTimelineVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.surf,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              padding: theme.spacing.xl,
              gap: theme.spacing.md,
              maxHeight: '75%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.faint, alignSelf: 'center' }} />
            <StyledText variant="title" color="ink">
              {selectedNode.label} — Nüzul Dönem Dağılımı
            </StyledText>
            <StyledText variant="footnote" color="mut">
              Kavramın Mekke ve Medine dönemleri boyunca ayetlerdeki nüzul sıklığı ve anlam gelişimi.
            </StyledText>

            <View style={{ gap: 12, marginTop: 8 }}>
              {[
                { donem: 'Erken Mekke', oran: '%45', desc: 'Ontolojik tanım, yaratılış ve tevhid bağlamı (Alak, Kalem)' },
                { donem: 'Orta Mekke', oran: '%25', desc: 'Kıssalar ve peygamberlerin ilim-hikmet mirası (Yunus, Kehf)' },
                { donem: 'Geç Mekke', oran: '%15', desc: 'Müşriklere karşı delil ve aklî münazara bağlamı (Enam, İbrahim)' },
                { donem: 'Medine', oran: '%15', desc: 'Toplumsal ahlak, şahitlik, adalet ve hukukî teşri (Bakara, Nisa)' },
              ].map((p, idx) => (
                <View key={idx} style={{ backgroundColor: theme.colors.band, borderRadius: theme.radius.md, padding: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StyledText variant="caption" color="ink" style={{ fontWeight: '700' }}>
                      {p.donem}
                    </StyledText>
                    <StyledText variant="caption" color="acc" style={{ fontWeight: '700' }}>
                      {p.oran}
                    </StyledText>
                  </View>
                  <StyledText variant="footnote" color="mut" style={{ marginTop: 4 }}>
                    {p.desc}
                  </StyledText>
                </View>
              ))}
            </View>

            <Button label="Kapat" variant="secondary" onPress={() => setTimelineVisible(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
