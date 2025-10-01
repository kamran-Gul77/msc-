"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Plus, MessageSquare, Trash2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
  scenario_id: string;
}

interface ChatSidebarProps {
  scenarioId: string;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  scenarioId,
  currentChatId,
  onChatSelect,
  onNewChat,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadChatSessions();
  }, [scenarioId, user]);

  const loadChatSessions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("scenario_id", scenarioId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error: conversationsError } = await supabase
        .from("conversations")
        .delete()
        .eq("chat_session_id", chatId);

      if (conversationsError) throw conversationsError;

      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", chatId);

      if (error) throw error;

      setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));

      if (currentChatId === chatId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="h-full bg-[#212121] border-[#303030] flex flex-col">
      <div className="p-4 border-b border-[#303030]">
        <Button
          onClick={onNewChat}
          className="w-full bg-[#303030] hover:bg-[#181818] text-[#fff] border border-[#181818]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading chats...</div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs">Start a new conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chatSessions.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? "bg-[#303030] border border-[#181818]"
                    : "bg-[#181818] hover:bg-[#303030] border border-transparent"
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-[#fff] truncate">
                      {chat.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(chat.last_message_at)}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#212121] border-[#303030]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#fff]">
                          Delete Chat
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Are you sure you want to delete this chat? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#303030] border-[#181818] text-[#fff] hover:bg-[#181818]">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
