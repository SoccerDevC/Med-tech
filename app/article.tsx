"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../utils/supabase"

interface Article {
  id: string
  title: string
  content: string
  image_url: string
  author: string
  published_at: string
}

export default function ArticleScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  const fetchArticle = async () => {
    try {
      setIsLoading(true)

      if (!articleId) {
        throw new Error("Article ID is required")
      }

      const { data, error } = await supabase.from("articles").select("*").eq("id", articleId).single()

      if (error) throw error

      setArticle(data)
    } catch (error) {
      console.error("Error fetching article:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5276" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </SafeAreaView>
    )
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#e74c3c" />
        <Text style={styles.errorTitle}>Article Not Found</Text>
        <Text style={styles.errorText}>The article you're looking for doesn't exist or has been removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Article</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.metaInfo}>
          <Text style={styles.author}>By {article.author}</Text>
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        </View>

        <Image
          source={{ uri: article.image_url || "/placeholder.svg?height=400&width=600" }}
          style={styles.image}
          resizeMode="cover"
        />

        <Text style={styles.articleContent}>
          {article.content.split("\n\n").map((paragraph, index) => (
            <Text key={index}>
              {paragraph}
              {"\n\n"}
            </Text>
          ))}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={20} color="#1a5276" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={20} color="#1a5276" />
            <Text style={styles.actionButtonText}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#1a5276" />
            <Text style={styles.actionButtonText}>Comment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.relatedArticlesSection}>
          <Text style={styles.relatedTitle}>Related Articles</Text>

          <TouchableOpacity style={styles.relatedArticleItem}>
            <Image source={{ uri: "/placeholder.svg?height=60&width=60" }} style={styles.relatedArticleImage} />
            <View style={styles.relatedArticleContent}>
              <Text style={styles.relatedArticleTitle}>Herbal Remedies for Sleep Disorders</Text>
              <Text style={styles.relatedArticleDate}>2 weeks ago</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.relatedArticleItem}>
            <Image source={{ uri: "/placeholder.svg?height=60&width=60" }} style={styles.relatedArticleImage} />
            <View style={styles.relatedArticleContent}>
              <Text style={styles.relatedArticleTitle}>Traditional Medicine in Modern Healthcare</Text>
              <Text style={styles.relatedArticleDate}>1 month ago</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} MedTech Health. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  shareButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  author: {
    fontSize: 14,
    color: "#666",
  },
  date: {
    fontSize: 14,
    color: "#999",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    marginLeft: 5,
    color: "#1a5276",
    fontSize: 14,
  },
  relatedArticlesSection: {
    marginBottom: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  relatedArticleItem: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  relatedArticleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  relatedArticleContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  relatedArticleDate: {
    fontSize: 12,
    color: "#999",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
})

