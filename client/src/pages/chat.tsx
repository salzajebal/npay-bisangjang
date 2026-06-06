import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { MessageSquare, Send, ArrowLeft, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, ChatRoom, ChatMessage } from "@shared/schema";

function renderMessage(text: string) {
  if (text.startsWith("[img]")) {
    const url = text.slice(5);
    return (
      <img
        src={url}
        alt="이미지"
        className="max-w-full max-h-56 rounded cursor-pointer"
        onClick={() => window.open(url, "_blank")}
      />
    );
  }
  return <span className="whitespace-pre-wrap">{text}</span>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: authData, isLoading: authLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const user = authData?.user;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function initChat() {
      try {
        const res = await apiRequest("POST", "/api/chat/rooms");
        const room: ChatRoom = await res.json();
        if (cancelled) return;
        setRoomId(room.id);

        const msgRes = await fetch(`/api/chat/rooms/${room.id}/messages`, {
          credentials: "include",
        });
        if (msgRes.ok) {
          const history: ChatMessage[] = await msgRes.json();
          if (!cancelled) setMessages(history);
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setWsConnected(true);
          ws.send(JSON.stringify({ type: "join", roomId: room.id }));
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "message" && parsed.data) {
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === parsed.data.id);
                if (exists) return prev;
                return [...prev, parsed.data];
              });
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!cancelled) setWsConnected(false);
        };
      } catch {}
    }

    initChat();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !wsRef.current || !roomId) return;
    wsRef.current.send(JSON.stringify({ type: "message", roomId, message: text }));
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!wsRef.current || !roomId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      wsRef.current.send(JSON.stringify({ type: "message", roomId, message: `[img]${url}` }));
    } catch {
      toast({ title: "이미지 업로드 실패", description: "다시 시도해주세요.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="page-chat">
      <header
        className="h-14 shrink-0 flex items-center gap-3 px-4 text-white"
        style={{ backgroundColor: "#E8344E" }}
        data-testid="chat-header"
      >
        <Link href="/dashboard">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 no-default-hover-elevate"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <MessageSquare className="w-5 h-5" />
        <h1 className="font-semibold text-base" data-testid="text-chat-title">
          1:1 고객센터 상담
        </h1>
        {!wsConnected && roomId && (
          <div className="ml-auto flex items-center gap-1.5 text-white/70 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            연결 중...
          </div>
        )}
      </header>

      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        data-testid="chat-messages-container"
      >
        {!roomId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">상담 채널 연결 중...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground" data-testid="text-empty-state">
                상담원에게 문의하실 내용을 입력해주세요
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                data-testid={`chat-message-${msg.id}`}
              >
                <div className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                  <span className="text-xs text-muted-foreground px-1" data-testid={`chat-sender-${msg.id}`}>
                    {isUser ? "나" : "상담원"}
                  </span>
                  <div
                    className={`rounded-md px-3 py-2 text-sm break-words ${
                      msg.message.startsWith("[img]") ? "p-1" : ""
                    } ${
                      isUser
                        ? "bg-[#E8344E] text-white"
                        : "bg-muted text-foreground"
                    }`}
                    data-testid={`chat-bubble-${msg.id}`}
                  >
                    {renderMessage(msg.message)}
                  </div>
                  <span className="text-[11px] text-muted-foreground px-1" data-testid={`chat-time-${msg.id}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t bg-background p-3" data-testid="chat-input-area">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            data-testid="input-chat-image-file"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => imageInputRef.current?.click()}
            disabled={!wsConnected || uploading}
            className="shrink-0 text-gray-500 hover:text-[#E8344E]"
            data-testid="button-attach-image"
            title="이미지 첨부"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </Button>
          <Textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            disabled={!wsConnected}
            rows={1}
            className="resize-none min-h-[40px] py-2 leading-snug"
            style={{ height: "40px", overflowY: "hidden" }}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!wsConnected || !inputText.trim()}
            className="bg-[#E8344E] border-[#E8344E]"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
