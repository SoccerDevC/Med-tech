"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { supabase } from "../utils/supabase"

// Add interfaces for data types
interface Appointment {
  id: string
  date: string
  status: string
  specialist?: {
    id: string
    full_name: string
  }
}

interface Specialist {
  id: string
  full_name: string
  specialty: string
  rating: number
  reviews: number
  avatar_url?: string
}

interface Article {
  id: string
  title: string
  excerpt: string
  image_url: string
  published_at: string
}

export default function HomeScreen() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [greeting, setGreeting] = useState("")
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null)
  const [verificationStatus, setVerificationStatus] = useState("pending")
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

    // Fetch data
    fetchUserData()
    fetchSpecialists()
    fetchArticles()
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
          .select("id, date, status, specialist:specialist_id(id, full_name)")
          .eq("patient_id", user.id)
          .gt("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(1)
          .single()

        if (appointment) {
          // Transform the specialist data from array to object if needed
          const formattedAppointment = {
            ...appointment,
            specialist: Array.isArray(appointment.specialist) ? appointment.specialist[0] : appointment.specialist,
          }
          setUpcomingAppointment(formattedAppointment)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from("specialists") // Updated to use specialists table
        .select("id, full_name, specialty, rating, reviews, avatar_url")
        .eq("availability_status", "available")
        .order("rating", { ascending: false })
        .limit(4)

      if (error) throw error

      if (data) {
        setSpecialists(data)
      }
    } catch (error) {
      console.error("Error fetching specialists:", error)
    }
  }

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, excerpt, image_url, published_at")
        .order("published_at", { ascending: false })
        .limit(2)

      if (error) throw error

      if (data) {
        setArticles(data)
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    }
  }

  const handleBookConsultation = () => {
    router.push("/booking")
  }

  const handleViewSpecialist = (specialistId: string) => {
    router.push({
      pathname: "/booking",
      params: { specialistId },
    })
  }

  const handleViewArticle = (articleId: string) => {
    router.push({
      pathname: "/article",
      params: { id: articleId },
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
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
              <TouchableOpacity onPress={() => router.push("/(tabs)/consultations")}>
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
                <Text style={styles.specialistName}>{upcomingAppointment.specialist?.full_name || "Specialist"}</Text>
              </View>
              <View style={styles.appointmentActions}>
                <TouchableOpacity
                  style={styles.rescheduleButton}
                  onPress={() =>
                    router.push({
                      pathname: "/booking",
                      params: { specialistId: upcomingAppointment.specialist?.id },
                    })
                  }
                >
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
          <Text style={styles.sectionTitle}>Herbal Specialists</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/specialists")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialistsContainer}
        >
          {specialists.length > 0
            ? specialists.map((specialist) => (
                <TouchableOpacity
                  key={specialist.id}
                  style={styles.specialistCard}
                  onPress={() => handleViewSpecialist(specialist.id)}
                >
                  <Image
                    source={{ uri: specialist.avatar_url || "/placeholder.svg?height=80&width=80" }}
                    style={styles.specialistImage}
                  />
                  <Text style={styles.specialistName}>{specialist.full_name}</Text>
                  <Text style={styles.specialistSpecialty}>{specialist.specialty}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#f39c12" />
                    <Text style={styles.ratingText}>
                      {specialist.rating.toFixed(1)} ({specialist.reviews})
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            : // Placeholder cards while loading
              Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.specialistCard}>
                  <View style={[styles.specialistImage, styles.placeholderImage]} />
                  <View style={styles.placeholderText} />
                  <View style={[styles.placeholderText, { width: 80 }]} />
                  <View style={[styles.placeholderText, { width: 60 }]} />
                </View>
              ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Articles</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {articles.length > 0
          ? articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() => handleViewArticle(article.id)}
              >
                <Image
                  source={{ uri: article.image_url || "/placeholder.svg?height=120&width=120" }}
                  style={styles.articleImage}
                />
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleExcerpt} numberOfLines={2}>
                    {article.excerpt}
                  </Text>
                  <Text style={styles.articleDate}>{formatRelativeTime(article.published_at)}</Text>
                </View>
              </TouchableOpacity>
            ))
          : // Placeholder cards while loading
            Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.articleCard}>
                <View style={[styles.articleImage, styles.placeholderImage]} />
                <View style={styles.articleContent}>
                  <View style={styles.placeholderText} />
                  <View style={[styles.placeholderText, { height: 30 }]} />
                  <View style={[styles.placeholderText, { width: 60 }]} />
                </View>
              </View>
            ))}
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
  // Placeholder styles for loading state
  placeholderImage: {
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    height: 14,
    width: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 8,
  },
})

