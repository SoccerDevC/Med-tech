"use client"

import { useEffect, useState } from "react"
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../utils/supabase"
import { checkPaymentStatus } from "../utils/payment-service"

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    processPaymentCallback()
  }, [])

  const processPaymentCallback = async () => {
    try {
      setIsLoading(true)

      const orderTrackingId = params.OrderTrackingId as string

      if (!orderTrackingId) {
        setError("Payment reference not found")
        return
      }

      // Verify payment status with PesaPal
      const paymentStatus = await checkPaymentStatus(orderTrackingId)

      if (!paymentStatus.success) {
        setError(paymentStatus.error || "Failed to verify payment status")
        return
      }

      // Find the consultation with this payment reference
      const { data: consultations, error: fetchError } = await supabase
        .from("consultations")
        .select("*")
        .eq("payment_reference", orderTrackingId)

      if (fetchError) throw fetchError

      if (!consultations || consultations.length === 0) {
        setError("Consultation not found for this payment")
        return
      }

      const consultation = consultations[0]

      // Update consultation status based on payment status
      if (paymentStatus.status === "COMPLETED") {
        await supabase.from("consultations").update({ status: "scheduled" }).eq("id", consultation.id)

        setIsSuccess(true)
      } else {
        await supabase
          .from("consultations")
          .update({
            status: "pending_payment",
            payment_status: paymentStatus.status,
          })
          .eq("id", consultation.id)

        setError(`Payment is not complete. Status: ${paymentStatus.status}`)
      }
    } catch (error: any) {
      console.error("Payment callback error:", error)
      setError(error.message || "An error occurred while processing your payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5276" />
          <Text style={styles.loadingText}>Verifying payment...</Text>
        </View>
      ) : isSuccess ? (
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successText}>
            Your consultation has been scheduled successfully. You can view your upcoming consultations in the
            consultations tab.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)/consultations")}>
            <Text style={styles.buttonText}>View My Consultations</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={80} color="#e74c3c" />
          </View>
          <Text style={styles.errorTitle}>Payment Issue</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)/consultations")}>
            <Text style={styles.buttonText}>Go to Consultations</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
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
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2ecc71",
    marginBottom: 15,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 15,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#1a5276",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

