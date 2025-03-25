"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { supabase } from "../../utils/supabase"

// Define the type for Ionicons names
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"]

// Add interfaces for specialty and specialist items
interface SpecialtyItem {
  id: string
  name: string
  icon: IoniconsName
}

interface SpecialistItem {
  id: string
  full_name: string
  specialty: string
  experience: string
  rating: number
  reviews: number
  available: boolean
  avatar_url: string
}

// Specialty options
const SPECIALTIES: SpecialtyItem[] = [
  { id: "1", name: "Herbal Medicine", icon: "leaf" },
  { id: "2", name: "Naturopathy", icon: "water" },
  { id: "3", name: "Ayurvedic", icon: "flower" },
  { id: "4", name: "Chinese Medicine", icon: "medkit" },
  { id: "5", name: "Homeopathy", icon: "flask" },
]

export default function SpecialistsScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSpecialists()
  }, [selectedSpecialty])

  const fetchSpecialists = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("specialists") // Updated to use specialists table
        .select(`
          id,
          full_name,
          specialty,
          experience,
          avatar_url,
          rating,
          reviews,
          availability_status
        `)

      if (selectedSpecialty) {
        query = query.ilike("specialty", `%${selectedSpecialty}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to match the SpecialistItem interface
      const formattedData = (data || []).map((specialist) => ({
        id: specialist.id,
        full_name: specialist.full_name || "Unnamed Specialist",
        specialty: specialist.specialty || "General Herbal Medicine",
        experience: specialist.experience || "N/A",
        rating: specialist.rating || 4.5,
        reviews: specialist.reviews || Math.floor(Math.random() * 100) + 50,
        available: specialist.availability_status === "available",
        avatar_url: specialist.avatar_url || "/placeholder.svg?height=80&width=80",
      }))

      setSpecialists(formattedData)
    } catch (error: any) {
      console.error("Error fetching specialists:", error)
      Alert.alert("Error", "Failed to load specialists")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookConsultation = (specialist: SpecialistItem) => {
    if (!specialist.available) {
      Alert.alert("Not Available", "This specialist is currently not available for consultations")
      return
    }

    // Navigate to booking screen
    router.push({
      pathname: "/booking",
      params: { specialistId: specialist.id },
    })
  }

  const filteredSpecialists = specialists.filter((specialist) => {
    const matchesSearch =
      specialist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const renderSpecialtyItem = ({ item }: { item: SpecialtyItem }) => (
    <TouchableOpacity
      style={[styles.specialtyItem, selectedSpecialty === item.name && styles.selectedSpecialtyItem]}
      onPress={() => setSelectedSpecialty(selectedSpecialty === item.name ? null : item.name)}
    >
      <Ionicons name={item.icon} size={20} color={selectedSpecialty === item.name ? "white" : "#1a5276"} />
      <Text style={[styles.specialtyText, selectedSpecialty === item.name && styles.selectedSpecialtyText]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  const renderSpecialistItem = ({ item }: { item: SpecialistItem }) => (
    <TouchableOpacity style={styles.specialistCard}>
      <View style={styles.specialistHeader}>
        <Image source={{ uri: item.avatar_url }} style={styles.specialistImage} />
        <View style={styles.specialistInfo}>
          <Text style={styles.specialistName}>{item.full_name}</Text>
          <Text style={styles.specialistSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f39c12" />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} ({item.reviews} reviews)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.specialistDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.experience} experience</Text>
        </View>

        <View style={styles.availabilityContainer}>
          <View
            style={[
              styles.availabilityIndicator,
              item.available ? styles.availableIndicator : styles.unavailableIndicator,
            ]}
          />
          <Text style={styles.availabilityText}>{item.available ? "Available Today" : "Unavailable"}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, !item.available && styles.disabledBookButton]}
        onPress={() => handleBookConsultation(item)}
        disabled={!item.available}
      >
        <Text style={styles.bookButtonText}>{item.available ? "Book Consultation" : "Not Available"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Herbal Specialists</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search specialists or specialties"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.specialtiesContainer}>
        <FlatList
          data={SPECIALTIES}
          renderItem={renderSpecialtyItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5276" />
          <Text style={styles.loadingText}>Loading specialists...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSpecialists}
          renderItem={renderSpecialistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.specialistsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={60} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No specialists found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your search or filters to find specialists</Text>
            </View>
          )}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  specialtiesContainer: {
    marginBottom: 15,
  },
  specialtiesList: {
    paddingHorizontal: 15,
  },
  specialtyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedSpecialtyItem: {
    backgroundColor: "#1a5276",
  },
  specialtyText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  selectedSpecialtyText: {
    color: "white",
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
  specialistsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  specialistCard: {
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
  specialistHeader: {
    flexDirection: "row",
    marginBottom: 15,
  },
  specialistImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  specialistInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  specialistDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availableIndicator: {
    backgroundColor: "#2ecc71",
  },
  unavailableIndicator: {
    backgroundColor: "#e74c3c",
  },
  availabilityText: {
    fontSize: 14,
    color: "#666",
  },
  bookButton: {
    backgroundColor: "#1a5276",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledBookButton: {
    backgroundColor: "#ccc",
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
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
})

