import { SetStateAction, Dispatch } from 'react'

export interface IIconProps {
  type: string
  props: any
}

export interface IThemeContext {
  theme: any
  setTheme: Dispatch<SetStateAction<string>>
  themeName: string
}

export interface Model {
  name: string;
  label: string;
  icon: any
}

export interface IAppContext {
  chatType: Model
  setChatType: Dispatch<SetStateAction<Model>>
  handlePresentModalPress: () => void
  setImageModel: Dispatch<SetStateAction<string>>
  imageModel: string,
  closeModal: () => void,
  walletAddress: string | null
  setWalletAddress: Dispatch<SetStateAction<string | null>>
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  currentScreen: string
  setCurrentScreen: Dispatch<SetStateAction<string>>
}