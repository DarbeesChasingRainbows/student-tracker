import { StorageType } from "../infrastructure/repositories/RepositoryFactory.ts";

/**
 * Database configuration
 * This file provides a central place to configure database settings
 */

// Environment-based configuration
const ENV = Deno.env.get("ENVIRONMENT") || "development";

// Default configurations for different environments
const configs = {
  development: {
    storageType: StorageType.POSTGRES,
    postgres: {
      connectionString: "postgres://postgres:postgres@localhost:5432/student_tracker_dev",
    },
    firebase: {
      apiKey: Deno.env.get("FIREBASE_API_KEY") || "",
      authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN") || "",
      projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "",
      storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET") || "",
      messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID") || "",
      appId: Deno.env.get("FIREBASE_APP_ID") || "",
      collection: "students",
    },
  },
  test: {
    storageType: StorageType.POSTGRES,
    postgres: {
      connectionString: "postgres://postgres:postgres@localhost:5432/student_tracker_test",
    },
    firebase: {
      apiKey: Deno.env.get("FIREBASE_API_KEY") || "",
      authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN") || "",
      projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "",
      storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET") || "",
      messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID") || "",
      appId: Deno.env.get("FIREBASE_APP_ID") || "",
      collection: "students_test",
    },
  },
  production: {
    storageType: StorageType.POSTGRES,
    postgres: {
      connectionString: Deno.env.get("DATABASE_URL") || 
        "postgres://postgres:postgres@localhost:5432/student_tracker_prod",
    },
    firebase: {
      apiKey: Deno.env.get("FIREBASE_API_KEY") || "",
      authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN") || "",
      projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "",
      storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET") || "",
      messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID") || "",
      appId: Deno.env.get("FIREBASE_APP_ID") || "",
      collection: "students_prod",
    },
  },
};

// Get the configuration for the current environment
const config = configs[ENV as keyof typeof configs] || configs.development;

// Override with environment variables if provided
if (Deno.env.get("DATABASE_URL")) {
  config.postgres.connectionString = Deno.env.get("DATABASE_URL") as string;
}

export const databaseConfig = {
  storageType: StorageType.POSTGRES,
  postgres: {
    connectionString: Deno.env.get("DATABASE_URL") || config.postgres.connectionString
  }
};

export default config;
