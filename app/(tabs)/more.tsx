"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert, Switch } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { supabase, signOut, getCurrentUser } from "../../utils/supabase"
// Add import for User type
import type { User } from "@supabase/supabase-js"

export default function MoreScreen() {
  const router = useRouter()
  // Update the state declaration
  const [user, setUser] = useState<User | null>(null)
  // Update the profile state
  const [profile, setProfile] = useState({
    full_name: "",
    email: "" as string | undefined,
    avatar_url: null as string | null,
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await getCurrentUser()

      if (user) {
        setUser(user)

        // Get user profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setProfile({
            full_name: profile.full_name || user.email || "",
            email: user.email || "",
            avatar_url: profile.avatar_url,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut()
          router.replace("/")
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Account Deletion", "Please contact support to delete your account.")
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Image
              source={{
                uri: profile.avatar_url || "/placeholder.svg?height=80&width=80",
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{profile.full_name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <View style={styles.healthDataCard}>
          <TouchableOpacity style={styles.healthDataHeader}>
            <Text style={styles.sectionTitle}>Health Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.healthDataContent}>
            <View style={styles.healthDataItem}>
              <View style={styles.healthDataIcon}>
                <Ionicons name="heart" size={20} color="#e74c3c" />
              </View>
              <View style={styles.healthDataInfo}>
                <Text style={styles.healthDataLabel}>Heart Rate</Text>
                <Text style={styles.healthDataValue}>72 bpm</Text>
              </View>
            </View>

            <View style={styles.healthDataItem}>
              <View style={styles.healthDataIcon}>
                <Ionicons name="fitness" size={20} color="#3498db" />
              </View>
              <View style={styles.healthDataInfo}>
                <Text style={styles.healthDataLabel}>Blood Pressure</Text>
                <Text style={styles.healthDataValue}>120/80 mmHg</Text>
              </View>
            </View>

            <View style={styles.healthDataItem}>
              <View style={styles.healthDataIcon}>
                <Ionicons name="thermometer" size={20} color="#f39c12" />
              </View>
              <View style={styles.healthDataInfo}>
                <Text style={styles.healthDataLabel}>Temperature</Text>
                <Text style={styles.healthDataValue}>98.6 °F</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="card" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="medkit" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Health Plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ccc", true: "#a8d2f0" }}
              thumbColor={notificationsEnabled ? "#1a5276" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#ccc", true: "#a8d2f0" }}
              thumbColor={darkModeEnabled ? "#1a5276" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Language</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed" size={20} color="#1a5276" />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#1a5276" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={20} color="#e74c3c" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a5276",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileText: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  healthDataCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthDataHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  healthDataContent: {
    padding: 15,
  },
  healthDataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  healthDataIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  healthDataInfo: {
    flex: 1,
  },
  healthDataLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  healthDataValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 15,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemValue: {
    fontSize: 14,
    color: "#999",
    marginRight: 5,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a5276",
    marginLeft: 10,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e74c3c",
    marginLeft: 10,
  },
  footer: {
    alignItems: "center",
    marginBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
})

