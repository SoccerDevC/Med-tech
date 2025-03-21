"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

// Add interface for consultation item
interface ConsultationItem {
  id: string
  specialist: string
  specialty: string
  date: Date
  status: string
  image: string
}

// Mock data for consultations
const MOCK_CONSULTATIONS = [
  {
    id: "1",
    specialist: "Dr. Sarah Johnson",
    specialty: "Herbal Medicine",
    date: new Date(2023, 5, 15, 10, 30),
    status: "upcoming",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "2",
    specialist: "Dr. Michael Chen",
    specialty: "Naturopathy",
    date: new Date(2023, 5, 10, 14, 0),
    status: "completed",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "3",
    specialist: "Dr. Emily Wilson",
    specialty: "Herbal Medicine",
    date: new Date(2023, 4, 28, 11, 15),
    status: "completed",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "4",
    specialist: "Dr. Robert Davis",
    specialty: "Ayurvedic Medicine",
    date: new Date(2023, 4, 20, 9, 0),
    status: "completed",
    image: "/placeholder.svg?height=60&width=60",
  },
]

export default function ConsultationsScreen() {
  const [activeTab, setActiveTab] = useState("upcoming")

  const filteredConsultations = MOCK_CONSULTATIONS.filter((consultation) => consultation.status === activeTab)

  const renderConsultationItem = ({ item }: { item: ConsultationItem }) => (
    <TouchableOpacity style={styles.consultationCard}>
      <View style={styles.consultationHeader}>
        <Image source={{ uri: item.image }} style={styles.specialistImage} />
        <View style={styles.specialistInfo}>
          <Text style={styles.specialistName}>{item.specialist}</Text>
          <Text style={styles.specialistSpecialty}>{item.specialty}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      <View style={styles.consultationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>

      {activeTab === "upcoming" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.rescheduleButton}>
            <Text style={styles.rescheduleText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinText}>Join Consultation</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "completed" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.viewRecordButton}>
            <Text style={styles.viewRecordText}>View Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookAgainButton}>
            <Text style={styles.bookAgainText}>Book Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )

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
        <TouchableOpacity style={styles.bookButton}>
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

      <FlatList
        data={filteredConsultations}
        renderItem={renderConsultationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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

