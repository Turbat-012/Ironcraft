import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'

import icons from '@/constants/icons'

const FormField = ({title, value, placeholder, handleChangeText, otherStyles, ...props}) => {

  const [showPassword, setShowPassword] = useState(false)
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className='text-base text-white font-rubik'>{title}</Text>

      <View className='border-2 border-primary-200 w-full h-16 px-4 bg-white rounded-2xl focus:border-orange items-center flex-row'>
        <TextInput
            className='flex-1 h-16 mb-2 text-black font-rubik-medium text-base items-center'
            value={value}
            placeholder={placeholder}
            placeholderTextColor={'#Ffffff'}
            onChangeText={handleChangeText}
            secureTextEntry={title==="Password" && !showPassword}
        />

        {title==="Password" && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}> 
                <Image source={showPassword ? icons.eye : icons.eyeHide} className='w-6 h-6' resizeMode='contain'/>
            </TouchableOpacity>)}
        
      </View>
    </View>
  )
}

export default FormField