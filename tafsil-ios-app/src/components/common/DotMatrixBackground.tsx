import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme';

interface DotMatrixBackgroundProps {
  /** Karanlık mod açık mı? Belirtilmezse etkin temadan okunur */
  isDark?: boolean;
  /** İki nokta arası grid aralığı (varsayılan: 26px) */
  spacing?: number;
  /** Nokta boyutu (varsayılan: 2.2px) */
  dotSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * tafsil.net tasarım dilinin imza arka plan deseni:
 * Ekran boyunca simetrik dağılmış hafif kare nokta matrisi (dot matrix).
 * Hem Açık (1a) hem Koyu (1b) modlarla kusursuz uyum sağlar.
 */
export const DotMatrixBackground = React.memo(function DotMatrixBackground({
  isDark: propIsDark,
  spacing = 26,
  dotSize = 2.2,
  style,
}: DotMatrixBackgroundProps) {
  const theme = useTheme();
  const isDark = propIsDark ?? theme.scheme === 'dark';
  const { width, height } = useWindowDimensions();

  const { rows, cols, startX, startY } = useMemo(() => {
    const colsCount = Math.floor(width / spacing) + 1;
    const rowsCount = Math.floor(height / spacing) + 1;
    const sX = Math.max(0, (width - (colsCount - 1) * spacing) / 2);
    const sY = Math.max(0, (height - (rowsCount - 1) * spacing) / 2);
    return { rows: rowsCount, cols: colsCount, startX: sX, startY: sY };
  }, [width, height, spacing]);

  // Tasarım referansı: Açık modda sıcak taş grisi, koyu modda yumuşak fildişi
  const dotColor = isDark
    ? 'rgba(244, 241, 234, 0.085)'
    : 'rgba(23, 22, 19, 0.09)';

  const colsArray = useMemo(() => Array.from({ length: cols }), [cols]);
  const rowsArray = useMemo(() => Array.from({ length: rows }), [rows]);

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <View style={{ paddingTop: startY }}>
        {rowsArray.map((_, r) => (
          <View
            key={r}
            style={[
              styles.row,
              {
                height: spacing,
                paddingHorizontal: startX,
              },
            ]}
          >
            {colsArray.map((_, c) => (
              <View
                key={c}
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: dotColor,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 0.4,
  },
});
