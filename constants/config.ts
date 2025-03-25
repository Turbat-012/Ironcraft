export const config = {
    platform: "com.jsm.ironcraft",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
    hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
    jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
    assignmentCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID,
    payCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PAY_COLLECTION_ID,
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    companiesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID,
  };