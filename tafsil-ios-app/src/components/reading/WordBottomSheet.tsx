import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { StyledText } from '../common/StyledText';
import { Button } from '../common/Button';
import { useTheme } from '../../theme';
import type { Word } from '../../api/types';

interface WordBottomSheetProps {
  word: Word | null;
  visible: boolean;
  onClose: () => void;
}

export function WordBottomSheet({ word, visible, onClose }: WordBottomSheetProps) {
  const theme = useTheme();

  if (!word) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.colors.surf,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            borderWidth: 1,
            borderColor: theme.colors.line,
            padding: theme.spacing.xl,
            gap: theme.spacing.md,
            minHeight: 260,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.faint,
              alignSelf: 'center',
              marginBottom: 4,
            }}
          />

          <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
            <StyledText variant="arabicHero" color="ink" style={{ writingDirection: 'rtl' }}>
              {word.textAr}
            </StyledText>
            {word.textTr ? (
              <StyledText variant="headline" color="ink">
                {word.textTr}
              </StyledText>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: theme.colors.band,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              gap: 4,
            }}
          >
            <StyledText variant="caption" color="faint">
              Sözlük & Morfoloji
            </StyledText>
            <StyledText variant="body" color="ink">
              {word.rootId ? `Kök No: #${word.rootId}` : 'Morfolojik kök analizi hazırlandı.'}
            </StyledText>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button
              label="Kapat"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
