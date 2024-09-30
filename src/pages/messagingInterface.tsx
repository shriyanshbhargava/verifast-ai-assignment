"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {  FaSpinner, FaSearch, FaCalendar } from "react-icons/fa";
import Avatar from "../assets/images/avatar.png";
import Snackbar from "../components/snackbar";

interface ChatSession {
  id: number;
  name: string;
  messages: Message[];
  message_count: number;
  role?: string;
}

interface Message {
  id: number;
  content: string;
  action: "USER" | "AI";
  timestamp: string;
}

const API_URL = "https://admin-backend-docker-india-306034828043.asia-south2.run.app/nlp/api/chat_sessions";

export default function MessagingInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchSessions = useCallback(async () => {
    if (loading || (totalPages !== null && page > totalPages)) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?page=${page}&per_page=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch sessions. Please try again.");
      }
      const data = await response.json();

      setTotalPages(data.total_pages || null);

      const sortedSessions = data.chat_sessions.sort((a: ChatSession, b: ChatSession) => {
        const aLatestMessage = a.messages[0]?.timestamp || new Date(0);
        const bLatestMessage = b.messages[0]?.timestamp || new Date(0);
        return new Date(bLatestMessage).getTime() - new Date(aLatestMessage).getTime();
      });

      setSessions((prevSessions) => {
        const combinedSessions = [...prevSessions, ...sortedSessions];
        return combinedSessions.sort((a, b) => {
          const aLatestMessage = a.messages[0]?.timestamp || new Date(0);
          const bLatestMessage = b.messages[0]?.timestamp || new Date(0);
          return new Date(bLatestMessage).getTime() - new Date(aLatestMessage).getTime();
        });
      });

      setPage((prevPage) => prevPage + 1);
    } catch (error: any) {
      setError(error.message);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  }, [page, loading, totalPages]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const lastSessionElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || (totalPages !== null && page > totalPages)) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchSessions();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, fetchSessions, totalPages, page]
  );

  const handleSessionClick = useCallback(
    (sessionId: number) => {
      const selected = sessions.find((session) => session.id === sessionId);
      if (selected) {
        setSelectedSession(sessionId);
        setMessages(selected.messages);
      }
    },
    [sessions]
  );

  const formatSessionTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  const formatMessageTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `Today ${format(date, "HH:mm")}`;
  };

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.messages[0]?.timestamp || 0);
    const isWithinDateRange =
      (!startDate || sessionDate >= new Date(startDate)) &&
      (!endDate || sessionDate <= new Date(endDate));

    return (
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      isWithinDateRange
    );
  });

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 font-sans">
      <Snackbar
        message={error || ""}
        isVisible={isSnackbarVisible}
        onClose={() => setSnackbarVisible(false)}
      />

      {/* Sidebar for Sessions */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Chat Sessions Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Search"
            >
              <FaSearch className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Date Range"
            >
              <FaCalendar className="text-gray-600" />
            </button>
          </div>
        </div>

        {showSearch && (
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="m-2 w-75 p-2 border rounded"
          />
        )}
        {showDateRange && (
          <div className="m-4 w-75 flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          {filteredSessions.map((session, index) => (
            <div
              key={session.id}
              ref={index === filteredSessions.length - 1 ? lastSessionElementRef : null}
              className={`flex items-center p-4 hover:bg-purple-50 cursor-pointer ${
                selectedSession === session.id ? "bg-purple-100" : ""
              }`}
              onClick={() => handleSessionClick(session.id)}
            >
              <div className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center overflow-hidden">
                <img
                  src={Avatar}
                  alt={session.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-sm font-medium text-gray-900 truncate">{session.name}</p>
                <p className="text-xs text-gray-500">
                  {session.role || (session.messages.length > 0 && formatSessionTimestamp(session.messages[0].timestamp))}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-center items-center p-4">
              <FaSpinner className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Section */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedSession ? (
          <>
            <div className="flex items-center p-4 border-b bg-white">
              <div className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center overflow-hidden">
                <img
                  src={Avatar}
                  alt="User Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-800">
                {sessions.find((s) => s.id === selectedSession)?.name}
              </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex flex-col ${
                    message.action === "USER" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.action === "USER"
                        ? "bg-rhino-950 text-white"
                        : "bg-midnight-950 text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatMessageTimestamp(message.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center flex-grow">
            <p className="text-gray-500">Select a session to view messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
