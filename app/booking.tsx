"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format, addDays, isWeekend, isSameDay } from "date-fns"
import { supabase } from "../utils/supabase"
import { initializePayment } from "../utils/payment-service"
import * as WebBrowser from "expo-web-browser"
import { checkPaymentStatus } from "../utils/payment-service"

interface BookingTimeSlot {
  time: string
  available: boolean
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]

export default function BookingScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const specialistId = params.specialistId as string
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [specialist, setSpecialist] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<BookingTimeSlot[]>([])
  const [consultationFee, setConsultationFee] = useState(2000) // in KES

  useEffect(() => {
    fetchSpecialistData()
  }, [specialistId])

  useEffect(() => {
    if (specialist) {
      fetchAvailableDates()
    }
  }, [specialist])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots()
    }
  }, [selectedDate])

  const fetchSpecialistData = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("specialists") // Updated to use specialists table
        .select("*")
        .eq("id", specialistId)
        .single()

      if (error) throw error

      if (data) {
        setSpecialist(data)
        // If specialist has a custom fee
        if (data.consultation_fee) {
          setConsultationFee(data.consultation_fee)
        }
      }
    } catch (error: any) {
      console.error("Error fetching specialist:", error)
      Alert.alert("Error", "Failed to load specialist information")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableDates = async () => {
    try {
      // Get all booked consultations for the specialist
      const { data: bookedConsultations, error } = await supabase
        .from("consultations")
        .select("date")
        .eq("specialist_id", specialistId)
        .gte("date", new Date().toISOString())

      if (error) throw error

      // Create an array of the next 14 days
      const nextTwoWeeks: Date[] = []
      for (let i = 0; i < 14; i++) {
        const day = addDays(new Date(), i)
        // Skip weekends
        if (!isWeekend(day)) {
          nextTwoWeeks.push(day)
        }
      }

      // Filter out days that are fully booked
      const availableDays = nextTwoWeeks.filter((day) => {
        // Count bookings on this day
        const bookingsOnDay = bookedConsultations?.filter((booking) => isSameDay(new Date(booking.date), day)) || []

        // Specialist is available if there are fewer than 7 bookings (all time slots)
        return bookingsOnDay.length < TIME_SLOTS.length
      })

      setAvailableDates(availableDays)

      // Set initial selected date to first available
      if (availableDays.length > 0) {
        setSelectedDate(availableDays[0])
      }
    } catch (error: any) {
      console.error("Error fetching available dates:", error)
      Alert.alert("Error", "Failed to load available dates")
    }
  }

  const fetchAvailableTimeSlots = async () => {
    try {
      // Get all booked consultations for the specialist on the selected date
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: bookedTimes, error } = await supabase
        .from("consultations")
        .select("date")
        .eq("specialist_id", specialistId)
        .gte("date", startOfDay.toISOString())
        .lte("date", endOfDay.toISOString())

      if (error) throw error

      // Create time slots with availability
      const timeSlots: BookingTimeSlot[] = TIME_SLOTS.map((time) => {
        // Check if time is booked
        const timeString = `${format(selectedDate, "yyyy-MM-dd")}T${time}:00`
        const isBooked = bookedTimes?.some((booking) => booking.date.startsWith(timeString))

        return {
          time,
          available: !isBooked,
        }
      })

      setAvailableTimeSlots(timeSlots)

      // Reset selected time
      setSelectedTime("")
    } catch (error: any) {
      console.error("Error fetching available time slots:", error)
      Alert.alert("Error", "Failed to load available time slots")
    }
  }

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios")
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleBooking = async () => {
    if (!selectedTime) {
      Alert.alert("Error", "Please select a time slot")
      return
    }

    try {
      setIsProcessing(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert("Error", "You must be logged in to book a consultation")
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      // Create consultation reference ID
      const reference = `MEDTECH-${Date.now()}`

      // Initialize payment
      const payment = await initializePayment({
        amount: consultationFee,
        description: `Consultation with ${specialist.full_name}`,
        reference,
        email: profile.email || user.email || "",
        firstName: profile.full_name?.split(" ")[0] || "Patient",
        lastName: profile.full_name?.split(" ").slice(1).join(" ") || "",
      })

      if (!payment.success) {
        throw new Error(payment.error || "Payment initialization failed")
      }

      // Create consultation in pending status
      const consultationDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":")
      consultationDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      const { error: consultationError } = await supabase.from("consultations").insert({
        patient_id: user.id,
        specialist_id: specialistId,
        date: consultationDateTime.toISOString(),
        status: "pending_payment",
        payment_reference: reference,
        payment_amount: consultationFee,
      })

      if (consultationError) throw consultationError

      // Open payment URL
      const result = await WebBrowser.openBrowserAsync(payment.redirectUrl)

      if (result.type === "cancel") {
        // User canceled payment
        Alert.alert(
          "Payment Canceled",
          "Your consultation booking is saved but requires payment. You can complete payment later in your consultations tab.",
        )

        router.replace("/(tabs)/consultations")
      } else {
        // Payment completed or browser closed
        // Check payment status

        const paymentStatus = await checkPaymentStatus(payment.orderId)

        if (paymentStatus.success && paymentStatus.status === "COMPLETED") {
          // Update consultation status
          await supabase.from("consultations").update({ status: "scheduled" }).eq("payment_reference", reference)

          Alert.alert("Booking Successful", "Your consultation has been scheduled successfully!", [
            { text: "OK", onPress: () => router.replace("/(tabs)/consultations") },
          ])
        } else {
          router.replace("/(tabs)/consultations")
        }
      }
    } catch (error: any) {
      console.error("Booking error:", error)
      Alert.alert("Error", error.message || "Failed to book consultation")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Book Consultation</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5276" />
          <Text style={styles.loadingText}>Loading specialist details...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {specialist && (
            <View style={styles.specialistCard}>
              <View style={styles.specialistHeader}>
                <Text style={styles.specialistName}>{specialist.full_name}</Text>
                <Text style={styles.specialistSpecialty}>{specialist.specialty || "Herbal Specialist"}</Text>
              </View>

              <View style={styles.feeContainer}>
                <Text style={styles.feeLabel}>Consultation Fee:</Text>
                <Text style={styles.feeAmount}>KES {consultationFee}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>

            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={24} color="#1a5276" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
                maximumDate={addDays(new Date(), 14)}
              />
            )}

            <Text style={styles.availabilityNote}>
              {availableDates.length === 0
                ? "No available dates in the next two weeks"
                : "Available dates are shown in the calendar"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>

            <View style={styles.timeSlotContainer}>
              {availableTimeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.timeSlotUnavailable,
                    selectedTime === slot.time && styles.timeSlotSelected,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextUnavailable,
                      selectedTime === slot.time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <Text style={styles.paymentInfo}>
              You will be redirected to the PesaPal payment gateway to complete your payment securely.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, (!selectedTime || isProcessing) && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={!selectedTime || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.bookButtonText}>Book and Pay</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a5276",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  specialistCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  specialistHeader: {
    marginBottom: 15,
  },
  specialistName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  specialistSpecialty: {
    fontSize: 16,
    color: "#666",
  },
  feeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a5276",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  availabilityNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeSlot: {
    width: "30%",
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  timeSlotUnavailable: {
    backgroundColor: "#f5f5f5",
  },
  timeSlotSelected: {
    backgroundColor: "#1a5276",
  },
  timeSlotText: {
    fontSize: 15,
    color: "#333",
  },
  timeSlotTextUnavailable: {
    color: "#999",
  },
  timeSlotTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  paymentInfo: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  bookButton: {
    backgroundColor: "#1a5276",
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "#a0b4c8",
  },
  bookButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})

