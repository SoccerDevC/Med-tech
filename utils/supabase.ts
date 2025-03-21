import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Authentication helpers
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  dateOfBirth: string,
  agreedToTerms: boolean,
) => {
  if (!agreedToTerms) {
    return { error: { message: "You must agree to the terms and conditions" } }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        date_of_birth: dateOfBirth,
        user_type: "patient",
        agreed_to_terms: agreedToTerms,
        is_verified: false,
      },
    },
  })

  if (data?.user) {
    // Create a profile record in the profiles table
    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      user_type: "patient",
    })
  }

  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "exp://localhost:8081/--/auth/callback",
    },
  })
}

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "exp://localhost:8081/--/reset-password",
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  return await supabase.auth.getUser()
}

export const getSession = async () => {
  return await supabase.auth.getSession()
}

