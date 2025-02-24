import { useGlobalContext } from "@/lib/global-provider";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import userRole from "@/lib/appwrite";

export default function AppLayout() {
  const { refetch, user, loading, isLoggedIn } = useGlobalContext();
  //const { user, loading, isLoggedIn } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isLoggedIn && user?.privilege != "admin") {
        router.replace("../(tabs)/hours"); // Redirect to the main screen if logged in
      }
      if (isLoggedIn && user?.privilege === "admin"){
        router.replace("../(admin)/aprofile"); //Redirect to Admin tabs
      }
       else {
        router.replace("../(auth)/sign-in"); // Redirect to the sign-in screen if not logged in
      }
    }
  }, [loading, isLoggedIn]);

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300 size=large" />
      </SafeAreaView>
    );
  }

  return <Slot />;
}