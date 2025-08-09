"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import Link from "next/link";

interface ChatSession {
  session_id: string;
  created_at: string;
  title: string;
}

interface ChatSidebarProps {
  onSelectSession: (sessionId: string) => void;
  activeSessionId: string | null;
}

export default function ChatSidebar({
  onSelectSession,
  activeSessionId,
}: ChatSidebarProps) {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sessions for this user
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.sub)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setSessions(data);
        }
        setLoading(false);
      });
  }, [user]);

  const handleNewChat = async () => {
    if (!user) return;

    const newId = crypto.randomUUID();

    const { error } = await supabase.from("chat_sessions").insert([
      {
        session_id: newId,
        user_id: user.sub,
        title: "New Chat",
      },
    ]);

    if (!error) {
      onSelectSession(newId);
      // Refresh sidebar list
      supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.sub)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setSessions(data);
        });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className="offcanvas offcanvas-start show text-white d-flex flex-column"
      tabIndex={-1}
      style={{
        width: isCollapsed ? "64px" : "320px",
        visibility: "visible",
        position: "fixed",
        zIndex: 1045,
        backgroundColor: "#161b22",
        borderRight: "1px solid #30363d",
        transition: "width 0.3s ease-in-out",
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-bottom d-flex flex-column gap-3"
        style={{ borderBottomColor: "#30363d" }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#238636",
              }}
            >
              <i
                className="bi bi-chat-dots-fill text-white"
                style={{ fontSize: "14px" }}
              ></i>
            </div>
            {!isCollapsed && (
              <h6 className="mb-0 fw-semibold" style={{ color: "#f0f6fc" }}>
                Chat History
              </h6>
            )}
          </div>
          <button
            className="btn p-1 d-flex align-items-center justify-content-center"
            onClick={toggleCollapse}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #30363d",
              color: "#8b949e",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              minWidth: "28px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#21262d";
              e.currentTarget.style.color = "#f0f6fc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#8b949e";
            }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>
        <button
          className="btn d-flex align-items-center justify-content-center gap-2 w-100 py-2"
          onClick={handleNewChat}
          style={{
            backgroundColor: "#238636",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2ea043";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#238636";
          }}
          title={isCollapsed ? "New Chat" : undefined}
        >
          <i className="bi bi-plus-lg" style={{ fontSize: "14px" }} />
          {!isCollapsed && "New Chat"}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-grow-1 overflow-auto">
        {loading ? (
          <div className="d-flex align-items-center justify-content-center p-4">
            <div
              className="spinner-border spinner-border-sm me-2"
              role="status"
              style={{ color: "#8b949e" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            {!isCollapsed && (
              <span style={{ color: "#8b949e", fontSize: "14px" }}>
                Loading chats...
              </span>
            )}
          </div>
        ) : (
          <div className="p-2">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={`rounded-3 p-3 mb-2 cursor-pointer position-relative ${
                  activeSessionId === session.session_id
                    ? "text-white"
                    : "text-white"
                }`}
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    activeSessionId === session.session_id
                      ? "#0969da"
                      : "transparent",
                  border:
                    activeSessionId === session.session_id
                      ? "none"
                      : "1px solid transparent",
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => onSelectSession(session.session_id)}
                onMouseEnter={(e) => {
                  if (activeSessionId !== session.session_id) {
                    e.currentTarget.style.backgroundColor = "#21262d";
                    e.currentTarget.style.borderColor = "#30363d";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSessionId !== session.session_id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
                title={isCollapsed ? session.title || "New Chat" : undefined}
              >
                <div
                  className={`d-flex align-items-start ${
                    isCollapsed ? "justify-content-center" : "gap-3"
                  }`}
                >
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor:
                        activeSessionId === session.session_id
                          ? "rgba(255,255,255,0.2)"
                          : "#30363d",
                      fontSize: "12px",
                    }}
                  >
                    <i
                      className="bi bi-chat-text"
                      style={{
                        color:
                          activeSessionId === session.session_id
                            ? "#fff"
                            : "#8b949e",
                      }}
                    />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-grow-1 min-width-0">
                        <div
                          className="fw-medium text-truncate mb-1"
                          style={{
                            fontSize: "14px",
                            color:
                              activeSessionId === session.session_id
                                ? "#fff"
                                : "#f0f6fc",
                          }}
                          title={session.title || "New Chat"}
                        >
                          {session.title || "New Chat"}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color:
                              activeSessionId === session.session_id
                                ? "rgba(255,255,255,0.7)"
                                : "#8b949e",
                          }}
                        >
                          {formatDate(session.created_at)}
                        </div>
                      </div>
                      {activeSessionId === session.session_id && (
                        <div
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "20px",
                            height: "20px",
                          }}
                        >
                          <i
                            className="bi bi-check-lg"
                            style={{ fontSize: "12px", color: "#fff" }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {sessions.length === 0 && !isCollapsed && (
              <div className="text-center p-4">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#21262d",
                    border: "2px dashed #30363d",
                  }}
                >
                  <i
                    className="bi bi-chat-dots"
                    style={{ fontSize: "20px", color: "#8b949e" }}
                  />
                </div>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  No conversations yet
                </p>
                <p
                  style={{
                    color: "#6e7681",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  Start your first chat by clicking the &quot;New Chat&quot; button above
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-top" style={{ borderTopColor: "#30363d" }}>
        <div
          className={`d-flex align-items-center ${
            isCollapsed ? "justify-content-center" : "gap-3"
          }`}
        >
          {/* Avatar */}
          {user?.picture ? (
            <Image
              src={user.picture}
              alt={user.name || "User"}
              width={28}
              height={28}
              className="rounded-circle"
            />
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#6f42c1",
              }}
            >
              <i
                className="bi bi-person-fill text-white"
                style={{ fontSize: "12px" }}
              />
            </div>
          )}

          {!isCollapsed && (
            <>
              <div className="flex-grow-1 min-width-0">
                <div
                  className="text-truncate fw-medium"
                  style={{ fontSize: "13px", color: "#f0f6fc" }}
                  title={user?.name || user?.email || "User"}
                >
                  {user?.name || user?.email || "User"}
                </div>
                <div style={{ fontSize: "11px", color: "#8b949e" }}>Online</div>
              </div>

              {/* Settings (three-dots) */}
              <button
                className="btn btn-sm d-flex align-items-center justify-content-center p-1"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #30363d",
                  color: "#8b949e",
                  width: "24px",
                  height: "24px",
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
                title="Settings"
              >
                <i className="bi bi-three-dots" style={{ fontSize: "12px" }} />
              </button>

              {/* Logout */}
              <Link href="/api/auth/logout" passHref legacyBehavior>
                <a
                  className="btn btn-sm d-flex align-items-center justify-content-center p-1"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #30363d",
                    color: "#8b949e",
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#da3633";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#8b949e";
                  }}
                  title="Log out"
                >
                  <i
                    className="bi bi-box-arrow-right"
                    style={{ fontSize: "12px" }}
                  />
                </a>
              </Link>
            </>
          )}

          {/* Collapsed mode: single logout icon */}
          {isCollapsed && (
            <Link href="/api/auth/logout" passHref legacyBehavior>
              <a
                className="btn btn-sm d-flex align-items-center justify-content-center p-1"
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#8b949e",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#da3633";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#8b949e";
                }}
                title="Log out"
              >
                <i
                  className="bi bi-box-arrow-right"
                  style={{ fontSize: "14px" }}
                />
              </a>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
