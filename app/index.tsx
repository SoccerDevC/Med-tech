"use client"

import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { LinearGradient } from "expo-linear-gradient"

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1a5276", "#2980b9"]} style={styles.background} />

      <View style={styles.logoContainer}>
        <Image source={{ uri: "/placeholder.svg?height=120&width=120" }} style={styles.logo} />
        <Text style={styles.appName}>MedTech Health</Text>
        <Text style={styles.tagline}>Connect with herbal specialists</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.signInButton]} onPress={() => router.push("/sign-in")}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={() => router.push("/sign-up")}>
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 30,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: "white",
  },
  signUpButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "white",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a5276",
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    marginBottom: 20,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  link: {
    color: "white",
    fontWeight: "500",
  },
})

