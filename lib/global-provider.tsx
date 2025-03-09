import { createContext, ReactNode, useContext, useEffect } from "react";
import { useAppwrite } from "./useAppwrite";
import { getCurrentUser } from "./appwrite";  
import { Redirect } from "expo-router";  
import { registerForPushNotificationsAsync } from './notifications';
import * as Notifications from 'expo-notifications';
import { databases } from './appwrite';
import { config } from '@/constants/config';
import { useRouter } from 'expo-router';

interface ContractorData {
    contractor_id: string;
    email: string;
    name: string;
    privilege: string;
    avatar: string;
}

interface User {
    $id: string;
    name: string;
    email: string; 
    avatar: string;
    privilege: string;
    contractorData?: ContractorData;
}

interface GlobalContextType {
    isLoggedIn: boolean;
    user: User | null;
    loading: boolean;  
    //refetch: () => void; 
    refetch: (newParams?: Record<string, string | number>) => Promise<void>; 
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
    children: ReactNode;
  }

export const GlobalProvider = ({ children }: GlobalProviderProps) => 
    {
        const {
            data: user,
            loading,
            refetch
        } = useAppwrite({
            fn: getCurrentUser,
        });

        const isLoggedIn = !!user;
        const router = useRouter();

        useEffect(() => {
            if (user) {
              registerForPushNotificationsAsync().then(async token => {
                if (token) {
                  try {
                    await databases.updateDocument(
                      config.databaseId!,
                      config.contractorCollectionId!,
                      user.$id,
                      {
                        pushToken: token.data
                      }
                    );
                    console.log('Push token stored successfully');
                  } catch (error) {
                    console.error('Error storing push token:', error);
                  }
                }
              }).catch(error => {
                console.error('Error registering for push notifications:', error);
              });
            }
          }, [user]);

        useEffect(() => {
            const notificationListener = Notifications.addNotificationReceivedListener(notification => {
              // Handle received notification
              console.log('Notification received:', notification);
            });
          
            const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
              // Handle notification response (e.g., when user taps notification)
              console.log('Notification response:', response);
              
              // Handle notification tap based on type
              const data = response.notification.request.content.data;
              if (data?.type === 'new_assignment') {
                router.push('/(root)/(tabs)/hours');
              }
            });
          
            return () => {
              Notifications.removeNotificationSubscription(notificationListener);
              Notifications.removeNotificationSubscription(responseListener);
            };
          }, []);
        
        return (
            <GlobalContext.Provider value ={{
                isLoggedIn,
                user,
                loading,
                refetch,
            }}>
                {children}
            </GlobalContext.Provider>
        );
    };

export const useGlobalContext = (): GlobalContextType => {
    const context = useContext(GlobalContext);

    if (!context) {
        throw new Error("useGlobalContext must be used within a GlobalProvider");
    }

    return context;
};

export default GlobalProvider;