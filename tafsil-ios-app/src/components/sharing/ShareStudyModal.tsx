import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Share,
  View,
  StyleSheet,
  Switch,
} from 'react-native';
import { StyledText } from '../common/StyledText';
import { Button } from '../common/Button';
import { useTheme } from '../../theme';

interface StudyShareData {
  id: string;
  title: string;
  question?: string;
  badge?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  study: StudyShareData | null;
  onSharedInApp?: () => void;
}

export function ShareStudyModal({ visible, onClose, study, onSharedInApp }: Props) {
  const theme = useTheme();
  const [excludeNotes, setExcludeNotes] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!study) return null;

  const deepLink = `https://tafsil.net/oturum/${study.id}`;

  const handleShareSystem = async () => {
    try {
      await Share.share({
        title: `${study.title} · tafsil`,
        message: `tafsil'de hazırladığım “${study.title}” başlıklı anlama çalışmasını incele: ${deepLink}`,
        url: deepLink,
      });
      onClose();
    } catch {
      // sessiz
    }
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: deepLink,
      });
      setFeedback('Bağlantı paylaşıldı / kopyalandı.');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    } catch {
      setFeedback('Bağlantı: ' + deepLink);
    }
  };

  const handleInAppShare = () => {
    setFeedback('Çalışma topluluk kavram havuzuna açıldı.');
    onSharedInApp?.();
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.colors.surf }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <StyledText variant="title" color="ink">
              Çalışmayı paylaş
            </StyledText>
            <Pressable onPress={onClose} hitSlop={12}>
              <StyledText variant="headline" color="mut">
                ×
              </StyledText>
            </Pressable>
          </View>

          <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
            Özet, okuma sırası ve notların birlikte gider.
          </StyledText>

          {/* Feedback banner */}
          {feedback ? (
            <View
              style={[
                styles.feedbackBox,
                { backgroundColor: theme.colors.accSoft, borderColor: theme.colors.acc },
              ]}
            >
              <StyledText variant="footnote" color="acc" style={{ fontWeight: '600' }}>
                ✓ {feedback}
              </StyledText>
            </View>
          ) : null}

          {/* 3 Share Options (Tafsil.dc.html satır 50-54) */}
          <View style={styles.buttonRow}>
            <Button
              label="Uygulama içinde"
              variant="secondary"
              onPress={handleInAppShare}
              style={styles.actionBtn}
            />
            <Button
              label="Bağlantı kopyala"
              variant="secondary"
              onPress={handleCopyLink}
              style={styles.actionBtn}
            />
            <Button
              label="Sosyal medya"
              variant="secondary"
              onPress={handleShareSystem}
              style={styles.actionBtn}
            />
          </View>

          {/* Toggle (Tafsil.dc.html satır 55) */}
          <View style={[styles.switchRow, { backgroundColor: theme.colors.band }]}>
            <StyledText variant="footnote" color="mut" style={{ flex: 1 }}>
              Kişisel notlarım paylaşıma dahil edilmesin
            </StyledText>
            <Switch
              value={excludeNotes}
              onValueChange={setExcludeNotes}
              trackColor={{ false: theme.colors.line, true: theme.colors.acc }}
              thumbColor={excludeNotes ? theme.colors.surf : theme.colors.faint}
            />
          </View>

          {/* Preview info */}
          <View style={[styles.previewCard, { backgroundColor: theme.colors.bg }]}>
            <StyledText variant="caption" color="acc" style={{ textTransform: 'uppercase' }}>
              ÖNİZLEME · {study.badge || 'Anlama Çalışması'}
            </StyledText>
            <StyledText variant="headline" color="ink" style={{ marginTop: 4 }}>
              {study.title}
            </StyledText>
            {study.question ? (
              <StyledText variant="footnote" color="mut" style={{ marginTop: 2 }}>
                {study.question}
              </StyledText>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    paddingHorizontal: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  previewCard: {
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
