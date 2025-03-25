"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { supabase } from "../../utils/supabase"
import { format } from "date-fns"

// Update the ConsultationItem interface to correctly match the Supabase response
interface ConsultationItem {
  id: string
  date: string
  status: string
  payment_reference?: string
  payment_amount?: number
  payment_status?: string
  notes?: string
  specialist?: {
    id: string
    full_name: string
    specialty?: string
    avatar_url?: string
  }
}

export default function ConsultationsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upcoming")
  const [consultations, setConsultations] = useState<ConsultationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchConsultations()
  }, [activeTab])

  const fetchConsultations = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No authenticated user found")
        return
      }

      const now = new Date().toISOString()

      // Query based on active tab
      let query = supabase
        .from("consultations")
        .select(`
          id,
          date,
          status,
          payment_reference,
          payment_amount,
          payment_status,
          notes,
          specialist:specialist_id(id, full_name, specialty, avatar_url)
        `)
        .eq("patient_id", user.id)

      if (activeTab === "upcoming") {
        // Upcoming: scheduled & pending payment consultations with date >= now
        query = query.in("status", ["scheduled", "pending_payment"]).gte("date", now).order("date", { ascending: true })
      } else {
        // Completed: completed consultations or past dates
        query = query.or(`status.eq.completed,date.lt.${now}`).order("date", { ascending: false })
      }

      // In the fetchConsultations function, update how we handle the data
      const { data, error } = await query

      if (error) throw error

      // Transform the data to ensure specialist is an object, not an array
      const formattedConsultations = (data || []).map((item) => ({
        ...item,
        specialist: Array.isArray(item.specialist) ? item.specialist[0] : item.specialist,
      }))

      setConsultations(formattedConsultations)
    } catch (error) {
      console.error("Error fetching consultations:", error)
      Alert.alert("Error", "Failed to load consultations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinConsultation = (consultation: ConsultationItem) => {
    // In a real app, this would navigate to a video call screen
    Alert.alert("Join Consultation", "This would launch the video consultation interface in a real app.", [
      { text: "OK" },
    ])
  }

  const handleReschedule = (consultation: ConsultationItem) => {
    // Navigate to booking screen with pre-selected specialist
    router.push({
      pathname: "/booking",
      params: { specialistId: consultation.specialist?.id },
    })
  }

  const handleViewRecord = (consultation: ConsultationItem) => {
    // In a real app, this would show consultation notes/record
    Alert.alert("Consultation Record", consultation.notes || "No notes available for this consultation", [
      { text: "OK" },
    ])
  }

  const handleBookAgain = (consultation: ConsultationItem) => {
    // Navigate to booking screen with pre-selected specialist
    router.push({
      pathname: "/booking",
      params: { specialistId: consultation.specialist?.id },
    })
  }

  const handleBookConsultation = () => {
    // Navigate to specialists screen to choose a specialist
    router.push("/(tabs)/specialists")
  }

  const renderConsultationItem = ({ item }: { item: ConsultationItem }) => {
    const consultationDate = new Date(item.date)
    const isPending = item.status === "pending_payment"

    return (
      <TouchableOpacity style={styles.consultationCard}>
        <View style={styles.consultationHeader}>
          <Image
            source={{
              uri: item.specialist?.avatar_url || "/placeholder.svg?height=60&width=60",
            }}
            style={styles.specialistImage}
          />
          <View style={styles.specialistInfo}>
            <Text style={styles.specialistName}>{item.specialist?.full_name || "Specialist"}</Text>
            <Text style={styles.specialistSpecialty}>{item.specialist?.specialty || "Herbal Medicine"}</Text>
            {isPending && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Payment Required</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>

        <View style={styles.consultationDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{format(consultationDate, "EEE, MMM d, yyyy")}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{format(consultationDate, "h:mm a")}</Text>
          </View>
        </View>

        {activeTab === "upcoming" && !isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.rescheduleButton} onPress={() => handleReschedule(item)}>
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinConsultation(item)}>
              <Text style={styles.joinText}>Join Consultation</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "upcoming" && isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.payButton} onPress={() => handleReschedule(item)}>
              <Text style={styles.payText}>Complete Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "completed" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewRecordButton} onPress={() => handleViewRecord(item)}>
              <Text style={styles.viewRecordText}>View Record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bookAgainButton} onPress={() => handleBookAgain(item)}>
              <Text style={styles.bookAgainText}>Book Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name={activeTab === "upcoming" ? "calendar" : "checkmark-circle"} size={60} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No {activeTab} consultations</Text>
      <Text style={styles.emptyStateText}>
        {activeTab === "upcoming"
          ? "You don't have any upcoming consultations scheduled."
          : "You haven't completed any consultations yet."}
      </Text>
      {activeTab === "upcoming" && (
        <TouchableOpacity style={styles.bookButton} onPress={handleBookConsultation}>
          <Text style={styles.bookButtonText}>Book a Consultation</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Consultations</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5276" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      ) : (
        <FlatList
          data={consultations}
          renderItem={renderConsultationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a5276",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  activeTab: {
    borderBottomColor: "#1a5276",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: "#1a5276",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  consultationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consultationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  specialistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  specialistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  specialistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  specialistSpecialty: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  pendingBadge: {
    backgroundColor: "#fef9e7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#f39c12",
  },
  pendingText: {
    fontSize: 12,
    color: "#f39c12",
    fontWeight: "500",
  },
  consultationDetails: {
    flexDirection: "row",
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: "#e6f0f7",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  rescheduleText: {
    color: "#1a5276",
    fontSize: 14,
    fontWeight: "500",
  },
  joinButton: {
    flex: 2,
    backgroundColor: "#1a5276",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  joinText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  payButton: {
    flex: 1,
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  payText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  viewRecordButton: {
    flex: 1,
    backgroundColor: "#e6f0f7",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  viewRecordText: {
    color: "#1a5276",
    fontSize: 14,
    fontWeight: "500",
  },
  bookAgainButton: {
    flex: 1,
    backgroundColor: "#1a5276",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  bookAgainText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  bookButton: {
    backgroundColor: "#1a5276",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
})

