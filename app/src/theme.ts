const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
  lightPink: '#F7B5CD',
  neonCyan: '#00f0ff',
  neonMagenta: '#ff00ff',
  cyberpunkDark: '#0d0221',
  matrixGreen: '#00ff41',
  matrixDarkGreen: '#003b00',
  matrixBlack: '#0d0d0d',
  // DeFi AI Theme Colors
  defiDarkBg: '#0f0f23',
  defiSecondaryBg: '#1a1a2e',
  defiCyan: '#00e5e5',
  defiPurple: '#a78bfa',
  defiGreen: '#00ff88',
  defiDarkPurple: '#1e1e3f',
  // Modern light theme palette
  lightBackground: '#F9FAFB', // soft off-white
  lightSurface: '#FFFFFF', // cards / surfaces
  lightMutedText: '#6B7280', // gray-600
  lightBorder: '#E5E7EB', // gray-200
  lightPrimary: '#6366F1', // indigo-500
  lightPrimarySoft: '#EEF2FF', // indigo-50
  lightSuccess: '#16A34A', // green-600
  lightError: '#DC2626', // red-600
}

const fonts = {
  ultraLightFont: 'Inter-ExtraLight',
  thinFont: 'Inter-Thin',
  regularFont: 'Inter-Regular',
  lightFont: 'Inter-Light',
  mediumFont: 'Inter-Medium',
  semiBoldFont: 'Inter-SemiBold',
  boldFont: 'Inter-Bold',
  blackFont: 'Inter-Black',
  ultraBlackFont: 'Inter-ExtraBold',
  // display font for special titles / hero text
  displayRegular: 'Lora-Regular',
  displaySemiBold: 'Lora-SemiBold',
  displayBold: 'Lora-Bold',
}

const lightTheme = {
  ...fonts,
  name: 'Light',
  label: 'light',
  textColor: '#111827', // gray-900
  secondaryTextColor: colors.lightMutedText,
  mutedForegroundColor: colors.lightMutedText,
  backgroundColor: colors.lightBackground,
  placeholderTextColor: '#9CA3AF', // gray-400
  secondaryBackgroundColor: colors.lightSurface,
  borderColor: colors.lightBorder,
  // primary action color (buttons, chips, key accents)
  tintColor: '#020617', // almost-black for strong contrast
  tintTextColor: colors.white,
  tabBarActiveTintColor: '#020617',
  tabBarInactiveTintColor: colors.lightMutedText,
}

const darkTheme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: colors.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
}

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
}

const miami = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink
}

const vercel = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  tintColor: '#171717',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
}

const cyberpunk = {
  ...darkTheme,
  name: 'Cyberpunk',
  label: 'cyberpunk',
  backgroundColor: colors.cyberpunkDark,
  tintColor: colors.neonCyan,
  tintTextColor: colors.cyberpunkDark,
  tabBarActiveTintColor: colors.neonCyan,
  tabBarInactiveTintColor: colors.neonMagenta,
  borderColor: 'rgba(0, 240, 255, .3)',
}

const matrix = {
  ...darkTheme,
  name: 'Matrix',
  label: 'matrix',
  backgroundColor: colors.matrixBlack,
  tintColor: colors.matrixGreen,
  tintTextColor: colors.matrixBlack,
  tabBarActiveTintColor: colors.matrixGreen,
  tabBarInactiveTintColor: colors.matrixDarkGreen,
  borderColor: 'rgba(0, 255, 65, .3)',
}

const defiAI = {
  ...darkTheme,
  name: 'DeFi AI',
  label: 'defiAI',
  backgroundColor: colors.defiDarkBg,
  secondaryBackgroundColor: colors.defiSecondaryBg,
  textColor: colors.white,
  secondaryTextColor: colors.defiCyan,
  mutedForegroundColor: 'rgba(255, 255, 255, 0.6)',
  placeholderTextColor: 'rgba(255, 255, 255, 0.4)',
  tintColor: colors.defiCyan,
  tintTextColor: colors.defiDarkBg,
  borderColor: 'rgba(0, 229, 229, 0.2)',
  tabBarActiveTintColor: colors.defiCyan,
  tabBarInactiveTintColor: colors.defiPurple,
}

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix, defiAI
}
