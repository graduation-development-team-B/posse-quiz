import { Image } from 'expo-image';

const SOURCES = {
  cheer: require('@/assets/images/mascot/cheer.png'),
  gentle: require('@/assets/images/mascot/gentle.png'),
  focus: require('@/assets/images/mascot/focus.png'),
  wink: require('@/assets/images/mascot/wink.png'),
  love: require('@/assets/images/mascot/love.png'),
  fun: require('@/assets/images/mascot/fun.png'),
  angry: require('@/assets/images/mascot/angry.png'),
  sad: require('@/assets/images/mascot/sad.png'),
} as const;

export type MascotMood = keyof typeof SOURCES;

const LABELS: Record<MascotMood, string> = {
  cheer: 'よろこんでいるマスコット',
  gentle: 'にこにこしているマスコット',
  focus: 'やる気まんまんのマスコット',
  wink: 'ウインクしているマスコット',
  love: 'うれしそうなマスコット',
  fun: 'ノリノリのマスコット',
  angry: 'むっとしているマスコット',
  sad: 'かなしんでいるマスコット',
};

type Props = {
  mood: MascotMood;
  size?: number;
};

export function Mascot({ mood, size = 56 }: Props) {
  return (
    <Image
      source={SOURCES[mood]}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={180}
      accessibilityLabel={LABELS[mood]}
    />
  );
}
