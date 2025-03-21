"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

// Add interface for chat item
interface ChatItem {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  image: string
}

// Mock data for chats
const MOCK_CHATS: ChatItem[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    lastMessage: "How are you feeling today?",
    time: "10:30 AM",
    unread: 2,
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    lastMessage: "Your test results look good. Let me know if you have any questions.",
    time: "Yesterday",
    unread: 0,
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "3",
    name: "Dr. Emily Wilson",
    lastMessage: "Remember to take your herbal medicine twice daily.",
    time: "Mon",
    unread: 0,
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "4",
    name: "MedTech Support",
    lastMessage: "Your appointment has been confirmed for June 15th at 10:30 AM.",
    time: "Jun 5",
    unread: 1,
    image: "/placeholder.svg?height=60&width=60",
  },
]

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = MOCK_CHATS.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.chatItemLeft}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>

      <View style={styles.chatItemContent}>
        <View style={styles.chatItemHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={[styles.chatMessage, item.unread > 0 && styles.unreadMessage]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color="#1a5276" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages"
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

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles" size={60} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>Your conversations with specialists will appear here</Text>
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a5276",
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0f7",
    alignItems: "center",
    justifyContent: "center",
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
  chatList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chatItemLeft: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e74c3c",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f8f9fa",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chatTime: {
    fontSize: 12,
    color: "#999",
  },
  chatMessage: {
    fontSize: 14,
    color: "#666",
  },
  unreadMessage: {
    fontWeight: "500",
    color: "#333",
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

