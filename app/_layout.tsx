"use client"

import type React from "react"

import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFonts } from "expo-font"
import { Stack, useRouter, useSegments } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { View, Text } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { getSession, supabase } from "../utils/supabase"
import type { Session } from "@supabase/supabase-js"
import { StatusBar } from "expo-status-bar"

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="verification" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

// Auth context for managing authentication state
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  // Check if the user is authenticated
  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return

    // Check if we're in the auth group (empty path, sign-in, sign-up, forgot-password)
    const inAuthGroup =
      !segments[0] || // Handle empty path
      segments[0] === "sign-in" ||
      segments[0] === "sign-up" ||
      segments[0] === "forgot-password"
    const inTabsGroup = segments[0] === "(tabs)"
    const inVerificationScreen = segments[0] === "verification"

    if (!session && !inAuthGroup) {
      // If not authenticated and not in auth group, redirect to sign in
      router.replace("/")
    } else if (session && !inTabsGroup && !inVerificationScreen) {
      // If authenticated but not in tabs or verification, check if verified
      supabase
        .from("profiles")
        .select("is_verified")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_verified) {
            router.replace("/(tabs)")
          } else {
            router.replace("/verification")
          }
        })
    }
  }, [session, segments, isLoading])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return <>{children}</>
}

