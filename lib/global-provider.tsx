import { createContext, ReactNode, useContext } from "react";
import { useAppwrite } from "./useAppwrite";
import { getCurrentUser } from "./appwrite";  
import { Redirect } from "expo-router";  

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