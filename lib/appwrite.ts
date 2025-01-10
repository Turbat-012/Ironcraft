import {Account, Avatars, Client, Databases, ID, OAuthProvider, Query} from "react-native-appwrite";
import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from "expo-web-browser";
import { red } from "react-native-reanimated/lib/typescript/Colors";
import hours from "@/app/(root)/(tabs)/hours";

export const config = {
    platform: "com.jsm.ironcraft",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
    hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
    jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)
    .setPlatform(config.platform!)

    
export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client); 

export async function login(email, password) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
  
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }

export async function logout() {
    try{
        await account.deleteSession('current');
        return true;
    }
    catch(error){
        console.error(error);
        return false;
    }
};

/*export async function getCurrentUser() {
  try {
    const response = await account.get();
    if (response.$id) {
      const userAvatar = avatar.getInitials(response.name);
      const userRole = response.privilege; // Assuming 'privilege' is the field name for the role

      return {
        ...response,
        avatar: userAvatar.toString(),
        privilege: userRole,
        //contractorData: contractorResponse, // Merge contractor data
      };
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}*/

export async function getCurrentUser() {
  try {
    const response = await account.get();
    if (response.$id) {
      const userAvatar = avatar.getInitials(response.name);

      // Fetch additional data from the "contractor" collection
      const contractorResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!,
        [Query.equal('contractor_id', response.$id)]
      );
      
      if (contractorResponse.documents.length > 0) {
        const contractorData = contractorResponse.documents[0];
        const userRole = contractorData.privilege; // Assuming 'privilege' is the field name for the role

        return {
          ...response,
          avatar: userAvatar.toString(),
          privilege: userRole,
          contractorData, // Merge contractor data
        };
      } else {
        throw new Error('Contractor data not found');
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const createUser = async (email: string, password: string, name: string) => {
    try {
      const newAccount = await account.create(ID.unique(), email, password, name);
      if (!newAccount) throw new Error('Failed to create a new account');
  
      await login(email, password);
  
      const newUser = await databases.createDocument(
        config.databaseId!,
        config.contractorCollectionId!,
        ID.unique(),
        {
          contractor_id: newAccount.$id,
          email,
          name,
          avatar: avatar.getInitials(name).toString(),
          privilege: 'user', // Set default role to 'user'
        }
      );

        return newUser;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
};

export const logHours = async (contractorId: string, hours: string, date: string) => {
    try {
        const newLog = await databases.createDocument(
            config.databaseId!,
            config.hoursCollectionId!,
            ID.unique(), // Generates a unique ID for the new document
            {
                contractor_id: contractorId,
                hours,
                date,
            }
        );

        return newLog; // newLog now contains the created document's details, including $id
    } catch (error) {
        console.log(error);
        throw new Error(error as string);
    }
};

export const getJobsiteForTomorrow = async (contractorId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  
      const response = await databases.listDocuments(
        config.databaseId!,
        config.jobsiteCollectionId!, // Collection ID for jobsites
        [`contractor_id=${contractorId}`, `date=${dateString}`]
      );
  
      if (response.documents.length > 0) {
        return response.documents[0];
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
};

export const getLoggedHours = async (contractorId: string, startDate: string, endDate: string) => {
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        'hours', // Collection ID for hours
        [
          `contractor_id=${contractorId}`,
          `date>=${startDate}`,
          `date<=${endDate}`
        ]
      );
  
      return response.documents;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };
  