"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format } from "date-fns"
import { supabase } from "../utils/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function VerificationScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [verificationChecked, setVerificationChecked] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [gender, setGender] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [preferredDate, setPreferredDate] = useState(new Date())
  const [showPreferredDatePicker, setShowPreferredDatePicker] = useState(false)
  const [preferredTime, setPreferredTime] = useState(new Date())
  const [showPreferredTimePicker, setShowPreferredTimePicker] = useState(false)
  const [timeZone, setTimeZone] = useState("")
  const [allergies, setAllergies] = useState("")
  const [healthIssue, setHealthIssue] = useState("")
  const [herbalHistory, setHerbalHistory] = useState("")
  const [privacyAgreement, setPrivacyAgreement] = useState(false)

  // Check if verification has already been submitted
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        // First check if we've already verified this in the current session
        const verificationStatus = await AsyncStorage.getItem("@verification_submitted")

        if (verificationStatus === "true") {
          // User has already submitted verification in this session
          router.replace("/(tabs)")
          return
        }

        // If not in AsyncStorage, check with Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // No user logged in, redirect to login
          router.replace("/sign-in")
          return
        }

        // Check if user has already submitted verification
        const { data: profile } = await supabase
          .from("profiles")
          .select("verification_submitted, is_verified")
          .eq("id", user.id)
          .single()

        if (profile && (profile.verification_submitted || profile.is_verified)) {
          // User has already submitted verification or is verified, store in AsyncStorage and redirect
          await AsyncStorage.setItem("@verification_submitted", "true")
          router.replace("/(tabs)")
          return
        }

        // Pre-fill form with user data if available
        if (user.user_metadata) {
          setFullName(user.user_metadata.full_name || "")
          setEmail(user.email || "")
          if (user.user_metadata.date_of_birth) {
            try {
              setDateOfBirth(new Date(user.user_metadata.date_of_birth))
            } catch (e) {
              console.error("Error parsing date of birth:", e)
            }
          }
        }

        // If we get here, user needs to complete verification
        setVerificationChecked(true)
      } catch (error) {
        console.error("Error checking verification status:", error)
        setVerificationChecked(true) // Show form on error to be safe
      }
    }

    checkVerificationStatus()
  }, [])

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateOfBirth
    setShowDatePicker(Platform.OS === "ios")
    setDateOfBirth(currentDate)
  }

  const handlePreferredDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || preferredDate
    setShowPreferredDatePicker(Platform.OS === "ios")
    setPreferredDate(currentDate)
  }

  const handlePreferredTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || preferredTime
    setShowPreferredTimePicker(Platform.OS === "ios")
    setPreferredTime(currentTime)
  }

  const handleSubmit = async () => {
    if (!fullName || !dateOfBirth || !gender || !phone || !healthIssue || !privacyAgreement) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert("Error", "User not found. Please sign in again.")
        return
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

      // If profile doesn't exist, create it first
      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
          user_type: "patient",
          is_verified: false,
          verification_submitted: true,
        })

        if (profileError) {
          throw profileError
        }
      }

      // Save verification data
      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        full_name: fullName,
        date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
        gender,
        email: email || user.email,
        address,
        phone,
        preferred_date: format(preferredDate, "yyyy-MM-dd"),
        preferred_time: format(preferredTime, "HH:mm"),
        time_zone: timeZone,
        allergies,
        health_issue: healthIssue,
        herbal_history: herbalHistory,
        privacy_agreement: privacyAgreement,
        status: "pending",
      })

      if (error) {
        console.error("Verification request error:", error)
        throw error
      }

      // Update user profile if it already existed
      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({
            verification_submitted: true,
            full_name: fullName,
            date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
          })
          .eq("id", user.id)
      }

      // Store verification status in AsyncStorage to prevent showing this screen again
      await AsyncStorage.setItem("@verification_submitted", "true")

      Alert.alert(
        "Success",
        "Your verification request has been submitted. You will be notified once it is approved.",
        [{ text: "OK", onPress: () => router.push("/(tabs)") }],
      )
    } catch (error: any) {
      console.error("Submission error:", error)
      Alert.alert("Error", error.message || "An error occurred while submitting your verification")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading indicator while checking verification status
  if (!verificationChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5276" />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Verification</Text>
          <Text style={styles.subtitle}>
            Please complete this form to verify your account and connect with herbal specialists
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Text>{format(dateOfBirth, "MMMM dd, yyyy")}</Text>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setGender("Male")}>
                <View style={styles.radioButton}>
                  {gender === "Male" && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioLabel}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioOption} onPress={() => setGender("Female")}>
                <View style={styles.radioButton}>
                  {gender === "Female" && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioLabel}>Female</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioOption} onPress={() => setGender("Other")}>
                <View style={styles.radioButton}>
                  {gender === "Other" && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioLabel}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Phone number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Date of Consultation</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPreferredDatePicker(true)}>
              <Text>{format(preferredDate, "MMMM dd, yyyy")}</Text>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            {showPreferredDatePicker && (
              <DateTimePicker
                value={preferredDate}
                mode="date"
                display="default"
                onChange={handlePreferredDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Time</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPreferredTimePicker(true)}>
              <Text>{format(preferredTime, "h:mm a")}</Text>
              <Ionicons name="time" size={20} color="#666" />
            </TouchableOpacity>
            {showPreferredTimePicker && (
              <DateTimePicker
                value={preferredTime}
                mode="time"
                display="default"
                onChange={handlePreferredTimeChange}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Time Zone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your time zone (e.g., GMT+3)"
              value={timeZone}
              onChangeText={setTimeZone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Do you have any food/herbal/drug allergies? <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="If yes, please specify"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Briefly describe the health issue(s) you wish to discuss <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your health concerns"
              value={healthIssue}
              onChangeText={setHealthIssue}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Have you ever used herbals before?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="If yes, please specify"
              value={herbalHistory}
              onChangeText={setHerbalHistory}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.privacyContainer} onPress={() => setPrivacyAgreement(!privacyAgreement)}>
            <View style={styles.checkbox}>
              {privacyAgreement && <Ionicons name="checkmark" size={16} color="#1a5276" />}
            </View>
            <Text style={styles.privacyText}>
              <Text style={styles.required}>*</Text> I consent to the collection and use of my personal and medical
              information by Med Herbal Online Clinic for the purpose of this consultation.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a5276",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  required: {
    color: "red",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1a5276",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1a5276",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  privacyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#1a5276",
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#1a5276",
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
})

