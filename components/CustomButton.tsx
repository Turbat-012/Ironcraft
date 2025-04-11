import { ActivityIndicator, Text, TouchableOpacity, Dimensions, Platform } from "react-native";
import { scaledSize } from '@/lib/textScaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const buttonHeight = Platform.select({ ios: 62, android: 56, default: 62 });

const CustomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-secondary rounded-xl flex flex-row justify-center items-center ${containerStyles} ${
        isLoading ? "opacity-50" : ""
      }`}
      style={{ 
        minHeight: buttonHeight,
        paddingHorizontal: SCREEN_WIDTH * 0.04 
      }}
      disabled={isLoading}
    >
      <Text 
        className={`text-primary font-psemibold ${textStyles}`}
        style={{ fontSize: scaledSize(Platform.select({ ios: 18, android: 16, default: 18 })) }}
        allowFontScaling={false}
      >
        {title}
      </Text>

      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size={Platform.select({ ios: "small", android: 24, default: "small" })}
          className="ml-2"
        />
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;