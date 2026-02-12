import Svg, { Path } from 'react-native-svg';

interface MenuIconProps {
  size?: number;
  color?: string;
}

export function MenuIcon({ size = 24, color = 'black' }: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12H21M3 6H21M3 18H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
