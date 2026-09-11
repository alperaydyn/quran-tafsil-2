import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';

/** App genelinde yüklenen font ağırlıkları. src/theme/typography.ts ile eşleşir. */
export function useAppFonts() {
  return useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold,
  });
}
