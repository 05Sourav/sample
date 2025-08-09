"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { trpc } from "./trpc/client";
import ChatSidebar from "./components/ChatSidebar";
import { supabase } from "./supabaseClient";
import { useUser } from "@auth0/nextjs-auth0/client";

interface Message {
  role: string;
  content: string;
  image?: string;
  created_at?: string;
  id?: string | number;
}

export default function Home() {
  // ✅ ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY EARLY RETURNS
  const { user, isLoading: authLoading } = useUser();

  // All useState hooks
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // All useRef hooks
  const chatEndRef = useRef<HTMLDivElement>(null);

  // All custom hooks
  const generateText = trpc.generateText.useMutation();
  const generateImage = trpc.generateImage.useMutation();

  // Restore active session from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("activeSessionId");
    if (savedId) setActiveSessionId(savedId);
  }, []);

  // Persist active session id to localStorage
  useEffect(() => {
    if (activeSessionId) localStorage.setItem("activeSessionId", activeSessionId);
  }, [activeSessionId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages for current user and active session
  useEffect(() => {
    if (!user?.sub || !activeSessionId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at, id, image")
        .eq("user_id", user.sub)
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();
  }, [user?.sub, activeSessionId]);

  // Close mobile sidebar when clicking outside or on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  // ------------- AUTH WALL -------------
  if (authLoading) {
    return (
      <div
        className="vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#0d1117" }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="vh-100 d-flex align-items-center justify-content-center p-3"
        style={{ backgroundColor: "#0d1117" }}
      >
        <div className="text-center">
          <i
            className="bi bi-robot mb-4"
            style={{ fontSize: "4rem", color: "#238636" }}
          />
          <h2 className="mb-4 text-white fw-semibold" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
            Welcome to AI Chat
          </h2>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/login"
            className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2 px-4 py-3"
            style={{ borderRadius: "8px", fontWeight: 500, fontSize: "1rem" }}
          >
            <i className="bi bi-box-arrow-in-right" />
            Sign in with Auth0
          </a>
        </div>
      </div>
    );
  }

  // Helper: Update chat session title (first 50 chars)
  const updateSessionTitle = async (firstLine: string) => {
    if (!activeSessionId || !user.sub) return;
    await supabase
      .from("chat_sessions")
      .update({ title: firstLine.slice(0, 50) })
      .eq("session_id", activeSessionId)
      .eq("user_id", user.sub)
      .eq("title", "New Chat");
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !input.trim() ||
      isLoading ||
      isImageLoading ||
      !user.sub ||
      !activeSessionId
    )
      return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    await supabase.from("messages").insert([
      {
        user_id: user.sub,
        content: input,
        role: "user",
        session_id: activeSessionId,
      },
    ]);
    await updateSessionTitle(input);

    try {
      const res = await generateText.mutateAsync({ prompt: input });
      const aiMsg = {
        role: "assistant",
        content: res.text || "(No response)",
      };
      setMessages((m) => [...m, aiMsg]);
      await supabase.from("messages").insert([
        {
          user_id: user.sub,
          content: res.text || "(No response)",
          role: "assistant",
          session_id: activeSessionId,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, there was an error with the AI response.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageGen = async () => {
    if (
      !input.trim() ||
      isLoading ||
      isImageLoading ||
      !user.sub ||
      !activeSessionId
    )
      return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsImageLoading(true);

    await supabase.from("messages").insert([
      {
        user_id: user.sub,
        content: input,
        role: "user",
        session_id: activeSessionId,
      },
    ]);
    await updateSessionTitle(input);

    try {
      const res = await generateImage.mutateAsync({ prompt: userMsg.content });
      const aiImageMsg = { role: "assistant", content: "", image: res.image };
      setMessages((m) => [...m, aiImageMsg]);
      await supabase.from("messages").insert([
        {
          user_id: user.sub,
          content: "[image]",
          role: "assistant",
          session_id: activeSessionId,
          image: res.image,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, there was an error with image generation.",
        },
      ]);
    } finally {
      setIsImageLoading(false);
    }
  };

  // ------------- CHAT UI (authenticated) -------------
  return (
    <div className="d-flex vh-100" style={{ backgroundColor: "#0d1117" }}>
      {/* Sidebar */}
      <ChatSidebar
        onSelectSession={(id) => {
          if (id !== activeSessionId) setMessages([]);
          setActiveSessionId(id);
        }}
        activeSessionId={activeSessionId}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div 
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: window.innerWidth >= 768 ? "320px" : "0",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        {/* Header */}
        <div
          className="text-white d-flex align-items-center shadow-sm border-bottom"
          style={{ 
            backgroundColor: "#161b22", 
            borderBottomColor: "#30363d",
            padding: "0.75rem 1rem",
          }}
        >
          <div className="d-flex align-items-center me-auto">
            {/* Mobile Menu Button */}
            <button
              className="btn btn-sm d-md-none me-2 d-flex align-items-center justify-content-center"
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #30363d",
                color: "#8b949e",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#21262d";
                e.currentTarget.style.color = "#f0f6fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#8b949e";
              }}
              title="Open menu"
            >
              <i className="bi bi-list" style={{ fontSize: "16px" }} />
            </button>

            <div
              className="rounded-circle me-3 d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#238636",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <i className="bi bi-chat-dots-fill text-white" />
            </div>
            <h5 
              className="mb-0 fw-semibold" 
              style={{ 
                color: "#f0f6fc",
                fontSize: window.innerWidth < 768 ? "1rem" : "1.25rem"
              }}
            >
              AI Chat Assistant
            </h5>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm d-none d-lg-inline-flex align-items-center gap-2"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #30363d",
                color: "#8b949e",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#21262d";
                e.currentTarget.style.color = "#f0f6fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#8b949e";
              }}
              aria-label="Settings"
              title="Settings"
            >
              <i className="bi bi-gear" style={{ fontSize: "14px" }} />
            </button>
            <button
              className="btn btn-sm d-none d-md-flex align-items-center justify-content-center"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #30363d",
                color: "#8b949e",
                width: "32px",
                height: "32px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#21262d";
                e.currentTarget.style.color = "#f0f6fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#8b949e";
              }}
              aria-label="More options"
              title="More options"
            >
              <i className="bi bi-three-dots-vertical" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-grow-1 overflow-auto"
          style={{ 
            backgroundColor: "#0d1117",
            padding: window.innerWidth < 768 ? "1rem 0.75rem" : "1.5rem 1rem"
          }}
        >
          <div 
            className="mx-auto" 
            style={{ 
              maxWidth: window.innerWidth < 768 ? "100%" : "800px",
              width: "100%"
            }}
          >
            {messages.length === 0 && (
              <div className="text-center py-5">
                <div
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: window.innerWidth < 768 ? "64px" : "80px",
                    height: window.innerWidth < 768 ? "64px" : "80px",
                    backgroundColor: "#238636",
                    fontSize: window.innerWidth < 768 ? "24px" : "32px",
                  }}
                >
                  <i className="bi bi-robot text-white" />
                </div>
                <h3 
                  className="mb-3" 
                  style={{ 
                    color: "#f0f6fc",
                    fontSize: window.innerWidth < 768 ? "1.25rem" : "1.5rem"
                  }}
                >
                  How can I help you today?
                </h3>
                <p 
                  className="text-muted mb-0"
                  style={{ fontSize: window.innerWidth < 768 ? "0.9rem" : "1rem" }}
                >
                  Start a conversation with your AI assistant
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={msg.id ?? i}
                className={`d-flex mb-4 ${
                  msg.role === "user" ? "justify-content-end" : "justify-content-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="rounded-circle me-2 me-md-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: window.innerWidth < 768 ? "28px" : "32px",
                      height: window.innerWidth < 768 ? "28px" : "32px",
                      backgroundColor: "#238636",
                      marginTop: "4px",
                    }}
                  >
                    <i
                      className="bi bi-robot text-white"
                      style={{ fontSize: window.innerWidth < 768 ? "12px" : "14px" }}
                      aria-label="AI assistant"
                      title="AI assistant"
                    />
                  </div>
                )}
                <div
                  className="rounded-4 position-relative text-white"
                  style={{
                    maxWidth: window.innerWidth < 768 ? "85%" : "75%",
                    wordBreak: "break-word",
                    backgroundColor: msg.role === "user" ? "#0969da" : "#161b22",
                    border: msg.role === "assistant" ? "1px solid #30363d" : "none",
                    fontSize: window.innerWidth < 768 ? "14px" : "15px",
                    lineHeight: "1.5",
                    padding: window.innerWidth < 768 ? "0.75rem 1rem" : "1rem 1.5rem",
                  }}
                >
                  {msg.content && (
                    <>
                      {msg.content.split("\n").map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </>
                  )}
                  {msg.image && (
                    <div className="mt-3">
                      <Image
                        src={msg.image}
                        alt="Generated"
                        width={window.innerWidth < 768 ? 300 : 400}
                        height={window.innerWidth < 768 ? 300 : 400}
                        className="rounded-3 shadow-sm"
                        style={{ 
                          maxHeight: window.innerWidth < 768 ? "300px" : "400px",
                          width: "100%",
                          height: "auto",
                          border: "1px solid #30363d" 
                        }}
                      />
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div
                    className="rounded-circle ms-2 ms-md-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: window.innerWidth < 768 ? "28px" : "32px",
                      height: window.innerWidth < 768 ? "28px" : "32px",
                      backgroundColor: "#6f42c1",
                      marginTop: "4px",
                    }}
                  >
                    <i
                      className="bi bi-person-fill text-white"
                      style={{ fontSize: window.innerWidth < 768 ? "12px" : "14px" }}
                      aria-label="User"
                      title="User"
                    />
                  </div>
                )}
              </div>
            ))}

            {(isLoading || isImageLoading) && (
              <div className="d-flex mb-4 justify-content-start">
                <div
                  className="rounded-circle me-2 me-md-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: window.innerWidth < 768 ? "28px" : "32px",
                    height: window.innerWidth < 768 ? "28px" : "32px",
                    backgroundColor: "#238636",
                    marginTop: "4px",
                  }}
                >
                  <i
                    className="bi bi-robot text-white"
                    style={{ fontSize: window.innerWidth < 768 ? "12px" : "14px" }}
                    aria-label="AI assistant loading"
                    title="AI assistant loading"
                  />
                </div>
                <div
                  className="rounded-4 d-flex align-items-center gap-3"
                  style={{
                    maxWidth: window.innerWidth < 768 ? "85%" : "75%",
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    fontSize: window.innerWidth < 768 ? "14px" : "15px",
                    padding: window.innerWidth < 768 ? "0.75rem 1rem" : "1rem 1.5rem",
                  }}
                >
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    role="status"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <span className="visually-hidden">Loading…</span>
                  </div>
                  <span style={{ color: "#8b949e" }}>
                    {isImageLoading ? "Generating image…" : "Thinking…"}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div
          className="border-top"
          style={{ 
            backgroundColor: "#0d1117", 
            borderTopColor: "#30363d",
            padding: window.innerWidth < 768 ? "1rem 0.75rem" : "1.5rem 1rem"
          }}
        >
          <style jsx>{`
            .custom-textarea::placeholder {
              color: #8b949e !important;
              opacity: 1;
            }
          `}</style>
          <form
            onSubmit={handleSend}
            className="mx-auto"
            style={{ 
              maxWidth: window.innerWidth < 768 ? "100%" : "800px",
              width: "100%"
            }}
          >
            <div className="position-relative">
              <div
                className="rounded-4 d-flex align-items-end gap-2 gap-md-3"
                style={{
                  backgroundColor: "#161b22",
                  border: "2px solid #30363d",
                  transition: "border-color 0.15s ease-in-out",
                  padding: window.innerWidth < 768 ? "0.75rem" : "1rem",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0969da")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#30363d")}
              >
                <textarea
                  className="form-control border-0 flex-grow-1 custom-textarea"
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  disabled={isLoading || isImageLoading}
                  rows={1}
                  style={{
                    backgroundColor: "transparent",
                    color: "#f0f6fc",
                    resize: "none",
                    fontSize: window.innerWidth < 768 ? "14px" : "15px",
                    minHeight: "24px",
                    maxHeight: "120px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
                <div className="d-flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleImageGen}
                    disabled={isLoading || isImageLoading || !input.trim()}
                    title="Generate an image from your text description"
                    className="btn d-flex align-items-center justify-content-center gap-1 gap-md-2"
                    style={{
                      backgroundColor:
                        input.trim() && !isLoading && !isImageLoading
                          ? "#6f42c1"
                          : "#30363d",
                      border: "none",
                      borderRadius: "8px",
                      minWidth: window.innerWidth < 768 ? "36px" : "90px",
                      height: "36px",
                      color:
                        input.trim() && !isLoading && !isImageLoading
                          ? "#fff"
                          : "#8b949e",
                      fontSize: "13px",
                      fontWeight: "500",
                      padding: window.innerWidth < 768 ? "0.5rem" : "0.5rem 0.75rem",
                    }}
                  >
                    <i className="bi bi-image" style={{ fontSize: "14px" }} />
                    <span className="d-none d-md-inline">Image</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isImageLoading || !input.trim()}
                    title="Send your message"
                    className="btn d-flex align-items-center justify-content-center gap-1 gap-md-2"
                    style={{
                      backgroundColor:
                        input.trim() && !isLoading && !isImageLoading
                          ? "#238636"
                          : "#30363d",
                      border: "none",
                      borderRadius: "8px",
                      minWidth: window.innerWidth < 768 ? "36px" : "80px",
                      height: "36px",
                      color:
                        input.trim() && !isLoading && !isImageLoading
                          ? "#fff"
                          : "#8b949e",
                      fontSize: "13px",
                      fontWeight: "500",
                      padding: window.innerWidth < 768 ? "0.5rem" : "0.5rem 0.75rem",
                    }}
                  >
                    <i className="bi bi-send-fill" style={{ fontSize: "14px" }} />
                    <span className="d-none d-md-inline">Send</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-2 px-1 gap-1 gap-md-0">
              <small 
                style={{ 
                  color: "#8b949e", 
                  fontSize: window.innerWidth < 768 ? "11px" : "13px"
                }}
              >
                Press{" "}
                <kbd
                  className="px-1 px-md-2 py-1 rounded"
                  style={{ 
                    backgroundColor: "#21262d", 
                    color: "#f0f6fc", 
                    fontSize: window.innerWidth < 768 ? "10px" : "12px"
                  }}
                >
                  Shift
                </kbd>{" "}
                +{" "}
                <kbd
                  className="px-1 px-md-2 py-1 rounded"
                  style={{ 
                    backgroundColor: "#21262d", 
                    color: "#f0f6fc", 
                    fontSize: window.innerWidth < 768 ? "10px" : "12px"
                  }}
                >
                  Enter
                </kbd>{" "}
                for a new line
              </small>
              <small 
                style={{ 
                  color: "#8b949e", 
                  fontSize: window.innerWidth < 768 ? "11px" : "13px",
                  textAlign: window.innerWidth < 768 ? "left" : "right"
                }}
              >
                AI can make mistakes. Verify important information.
              </small>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}