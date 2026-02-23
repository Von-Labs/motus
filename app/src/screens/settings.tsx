import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { useHotWallet } from '../context/HotWalletContext'
import {
  AnthropicIcon
 } from '../components/index'
import { MODELS } from '../../constants'
import { debugDatabase } from '../utils/database'

const models = [
  MODELS.claudeOpus,
  MODELS.claudeSonnet,
  MODELS.claudeHaiku
]

export function Settings() {
  const { theme } = useContext(ThemeContext)
  const { chatType, setChatType } = useContext(AppContext)
  const { isHotWalletFeatureEnabled } = useHotWallet()
  const navigation = useNavigation<any>()
  const styles = getStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {isHotWalletFeatureEnabled && (
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('HotWallet')}
        >
          <Ionicons name="flame-outline" size={22} color={theme.textColor} />
          <Text style={styles.menuRowText}>Hot Wallet</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.mutedForegroundColor} />
        </TouchableOpacity>
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Chat Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          models.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setChatType(model)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(chatType.label, model.label, theme)}}
                >
                <View style={{marginRight: 8}}>
                  <AnthropicIcon
                    theme={theme}
                    size={18}
                    selected={chatType.label === model.label}
                  />
                </View>
                <Text
                  style={{...styles.chatTypeText, ...getDynamicTextStyle(chatType.label, model.label, theme)}}
                >
                  { model.name }
                </Text>
              </View>
            </TouchableHighlight>
            )
          })
        }
      </View>
    </ScrollView>
  )
}

function getDynamicTextStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}


function getDynamicViewStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

const getStyles = (theme:any) => StyleSheet.create({
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 12,
  },
  menuRowText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
  },
  buttonContainer: {
    marginBottom: 20
  },
  container: {
    padding: 14,
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 10,
  },
  contentContainer: {
    paddingBottom: 40
  },
  titleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10
  },
  chatChoiceButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row'
  },
  chatTypeText: {
    fontFamily: theme.semiBoldFont,
    color: theme.textColor
  },
  mainText: {
    fontFamily: theme.boldFont,
    fontSize: 18,
    color: theme.textColor
  },
})