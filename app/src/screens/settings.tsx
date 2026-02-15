import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Alert
} from 'react-native'
import React, { useContext } from 'react'
import { AppContext, ThemeContext } from '../context'
import {
  AnthropicIcon,
  OpenAIIcon,
  GeminiIcon
} from '../components/index'
import { MODELS } from '../../constants'
import { debugDatabase } from '../utils/database'

const models = [
  MODELS.claudeOpus,
  MODELS.claudeSonnet,
  MODELS.claudeHaiku,
  MODELS.gpt52,
  MODELS.gpt5Mini,
  MODELS.gemini
]

export function Settings() {
  const { theme } = useContext(ThemeContext)
  const {
    chatType,
    setChatType,
  } = useContext(AppContext)

  const styles = getStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={styles.titleContainer}
      >
      <Text
          style={styles.mainText}
        >Chat Model</Text>
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
                  {React.createElement(model.icon, {
                    theme,
                    size: 18,
                    selected: chatType.label === model.label
                  })}
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
  buttonContainer: {
    marginBottom: 20
  },
  container: {
    padding: 14,
    flex: 1,
    backgroundColor: theme.backgroundColor,
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