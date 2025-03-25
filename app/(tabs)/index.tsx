"use client"

import { useState, useEffect, useRef } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../utils/supabase"
import { WebView } from "react-native-webview"

// Add interfaces for data types
interface Appointment {
  date: string
  specialist?: {
    full_name: string
  }
}

interface Specialist {
  id: string
  full_name: string
  specialty: string
  rating: number
  avatar_url?: string
}

export default function HomeScreen() {
  const [userName, setUserName] = useState("")
  const [greeting, setGreeting] = useState("")
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null)
  const [verificationStatus, setVerificationStatus] = useState("pending")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const webViewRef = useRef(null)

  // Define specialists with real data
  const specialists: Specialist[] = [
    {
      id: "1",
      full_name: "Grace Nambatya",
      specialty: "Herbal Medicine",
      rating: 4.9,
      avatar_url: "https://via.placeholder.com/80",
    },
    {
      id: "2",
      full_name: "Kato Martin",
      specialty: "Traditional Medicine",
      rating: 4.8,
      avatar_url: "https://via.placeholder.com/80",
    },
    {
      id: "3",
      full_name: "Sarah Nabukenya",
      specialty: "Nutritional Herbalist",
      rating: 4.7,
      avatar_url: "https://via.placeholder.com/80",
    },
    {
      id: "4",
      full_name: "John Musisi",
      specialty: "Medicinal Plants",
      rating: 4.6,
      avatar_url: "https://via.placeholder.com/80",
    },
  ]

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good Morning")
    } else if (hour < 18) {
      setGreeting("Good Afternoon")
    } else {
      setGreeting("Good Evening")
    }

    // Fetch user data
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get user profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setUserName(profile.full_name || user.email)
          setVerificationStatus(profile.is_verified ? "verified" : "pending")
        }

        // Get upcoming appointment
        const { data: appointment } = await supabase
          .from("consultations")
          .select("*, specialist:specialist_id(*)")
          .eq("patient_id", user.id)
          .gt("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(1)
          .single()

        if (appointment) {
          setUpcomingAppointment(appointment)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleBookConsultation = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentClose = () => {
    setShowPaymentModal(false)
  }

  const handlePaymentSuccess = async (data: any) => {
    // Process successful payment
    console.log("Payment successful:", data)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Create a consultation record
        const { error } = await supabase.from("consultations").insert({
          patient_id: user.id,
          specialist_id: specialists[0].id, // Default to first specialist or let user choose
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Schedule for 1 week from now
          status: "scheduled",
          notes: "Booked via Pesapal payment",
        })

        if (error) {
          console.error("Error creating consultation:", error)
        } else {
          // Refresh user data to show the new appointment
          fetchUserData()
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error)
    }

    setShowPaymentModal(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#1a5276" />
          </TouchableOpacity>
        </View>

        {verificationStatus === "pending" && (
          <View style={styles.verificationBanner}>
            <Ionicons name="alert-circle" size={24} color="#f39c12" />
            <Text style={styles.verificationText}>
              Your account is pending verification. We'll notify you once it's approved.
            </Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Search for specialists or treatments</Text>
          </View>
        </View>

        {upcomingAppointment ? (
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTitle}>Upcoming Consultation</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.appointmentDetails}>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentDate}>
                  {new Date(upcomingAppointment.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={styles.appointmentTime}>
                  {new Date(upcomingAppointment.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={styles.specialistName}>
                  Dr. {upcomingAppointment.specialist?.full_name || "Specialist"}
                </Text>
              </View>
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={styles.rescheduleButton}>
                  <Text style={styles.rescheduleText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noAppointmentCard}>
            <Ionicons name="calendar" size={40} color="#1a5276" />
            <Text style={styles.noAppointmentText}>No upcoming consultations</Text>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookConsultation}>
              <Text style={styles.bookButtonText}>Book a Consultation</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Specialists</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialistsContainer}
        >
          {specialists.map((specialist) => (
            <TouchableOpacity key={specialist.id} style={styles.specialistCard}>
              <Image source={{ uri: specialist.avatar_url }} style={styles.specialistImage} />
              <Text style={styles.specialistName}>Dr. {specialist.full_name}</Text>
              <Text style={styles.specialistSpecialty}>{specialist.specialty}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#f39c12" />
                <Text style={styles.ratingText}>{specialist.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Articles</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {[1, 2].map((item) => (
          <TouchableOpacity key={item} style={styles.articleCard}>
            <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.articleImage} />
            <View style={styles.articleContent}>
              <Text style={styles.articleTitle}>
                {item === 1 ? "Benefits of Herbal Medicine" : "Natural Remedies for Common Ailments"}
              </Text>
              <Text style={styles.articleExcerpt} numberOfLines={2}>
                {item === 1
                  ? "Discover the amazing benefits of traditional herbal medicine and how it can improve your health..."
                  : "Learn about natural remedies that can help alleviate common health issues without side effects..."}
              </Text>
              <Text style={styles.articleDate}>{item === 1 ? "2 days ago" : "1 week ago"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payment Modal with Pesapal Integration */}
      <Modal visible={showPaymentModal} animationType="slide" transparent={false} onRequestClose={handlePaymentClose}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Consultation</Text>
            <TouchableOpacity onPress={handlePaymentClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            source={{ uri: "https://store.pesapal.com/medtechengineeringfinancialsol" }}
            style={styles.webView}
            onNavigationStateChange={(navState) => {
              // Check for successful payment
              if (navState.url.includes("success") || navState.url.includes("callback")) {
                handlePaymentSuccess(navState)
              }
            }}
          />
        </SafeAreaView>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a5276",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0f7",
    alignItems: "center",
    justifyContent: "center",
  },
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef9e7",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  verificationText: {
    flex: 1,
    marginLeft: 10,
    color: "#7d6608",
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: "#999",
    fontSize: 16,
  },
  appointmentCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#1a5276",
  },
  appointmentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  appointmentActions: {
    flexDirection: "row",
  },
  rescheduleButton: {
    backgroundColor: "#e6f0f7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  rescheduleText: {
    color: "#1a5276",
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: "#1a5276",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  noAppointmentCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noAppointmentText: {
    fontSize: 16,
    color: "#666",
    marginVertical: 10,
  },
  bookButton: {
    backgroundColor: "#1a5276",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  specialistsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  specialistCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    width: 140,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  specialistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  specialistName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  specialistSpecialty: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  articleCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  articleContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  articleExcerpt: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  articleDate: {
    fontSize: 12,
    color: "#999",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  webView: {
    flex: 1,
  },
})

