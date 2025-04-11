import { View, Text, TextInput, TouchableOpacity, Image, Dimensions, Platform } from 'react-native'
import React, { useState } from 'react'
import { scaledSize } from '@/lib/textScaling'
import icons from '@/constants/icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const inputHeight = Platform.select({ ios: 56, android: 52, default: 56 });

const FormField = ({title, value, placeholder, handleChangeText, otherStyles, ...props}) => {
  const [showPassword, setShowPassword] = useState(false)
  
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text style={{ fontSize: scaledSize(Platform.OS === 'ios' ? 16 : 14) }} className='text-white font-rubik'>
        {title}
      </Text>

      <View className='border-2 border-primary-200 w-full rounded-2xl focus:border-orange items-center flex-row' 
        style={{ height: inputHeight, paddingHorizontal: SCREEN_WIDTH * 0.04 }}>
        <TextInput
            className='flex-1 mb-2 text-black font-rubik-medium items-center'
            style={{ 
              height: inputHeight,
              fontSize: scaledSize(16)
            }}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={'#Ffffff'}
            onChangeText={handleChangeText}
            secureTextEntry={title==="Password" && !showPassword}
            allowFontScaling={false}
        />

        {title==="Password" && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}> 
              <Image source={!showPassword ? icons.eyeHide : icons.eye} 
                     style={{ width: SCREEN_WIDTH * 0.06, height: SCREEN_WIDTH * 0.06 }} 
                     resizeMode="contain" />
            </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField