import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";

// Add notification sound
const notificationSound = new Audio("/notification.mp3");

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);

  const playNotificationSound = () => {
    notificationSound
      .play()
      .catch((err) => console.log("Audio play failed:", err));
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Set up Socket.IO connection
    const newSocket = io("http://localhost:3002", {
      withCredentials: true,
    });

    setSocket(newSocket);

    // Join user's room
    newSocket.emit("joinUser", user._id);
    console.log("Joined socket room for user:", user._id);

    // Listen for notifications
    newSocket.on("notification", (notification) => {
      console.log("Received notification:", notification);

      if (notification.type === "FOLLOW_REQUEST") {
        handleFollowRequest(notification);
      } else if (notification.type === "FOLLOW_ACCEPTED") {
        handleFollowAccepted(notification);
      } else if (notification.type === "NEW_JOB") {
        handleJobNotification(notification);
      }
    });

    // Handle connection events
    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (newSocket) {
        console.log("Disconnecting socket");
        newSocket.disconnect();
      }
    };
  }, [user]);

  const handleFollowRequest = (notification) => {
    setNotifications((prev) => [
      {
        _id: notification.notificationId,
        type: notification.type,
        sender: {
          _id: notification.senderId,
          username: notification.senderName,
        },
        status: "pending",
      },
      ...prev,
    ]);
    playNotificationSound();
    toast.success(`${notification.senderName} wants to follow you!`);
  };

  const handleFollowAccepted = (notification) => {
    playNotificationSound();
    toast.success(`${notification.accepterName} accepted your follow request!`);
  };

  const handleJobNotification = (notification) => {
    console.log("Processing job notification:", notification);
    try {
      setNotifications((prev) => [
        {
          _id: notification.notificationId,
          type: notification.type,
          sender: {
            _id: notification.senderId,
            username: notification.senderName,
          },
          jobId: notification.jobId,
          jobTitle: notification.jobTitle,
          company: notification.company,
        },
        ...prev,
      ]);
      playNotificationSound();
      toast.success(
        `${notification.senderName} posted a new job: ${notification.jobTitle} at ${notification.company}`
      );
    } catch (error) {
      console.error("Error processing job notification:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3002/api/notifications",
        {
          withCredentials: true,
        }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleNotificationAction = async (notificationId, action) => {
    try {
      console.log(
        `Sending ${action} request for notification ${notificationId}`
      );
      const response = await axios.post(
        `http://localhost:3002/api/follow/${action}`,
        { notificationId },
        { withCredentials: true }
      );

      if (response.data) {
        // Update notifications list
        setNotifications(notifications.filter((n) => n._id !== notificationId));
        toast.success(`Follow request ${action}ed`);

        // If accept action was successful, emit socket event
        if (action === "accept" && socket) {
          const notification = notifications.find(
            (n) => n._id === notificationId
          );
          if (notification) {
            socket.emit("followStatusUpdate", {
              userId: notification.sender._id,
              status: "following",
            });
          }
        }
      }
    } catch (error) {
      console.error(
        `Error ${action}ing follow request:`,
        error.response || error
      );
      toast.error(
        error.response?.data?.message || `Error ${action}ing follow request`
      );
    }
  };

  // Don't render navbar if user is not authenticated
  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold">Message App</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/post-job")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Post Job
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-2 text-gray-500">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((notification) => {
                      // Get the sender name from populated sender object
                      const senderName = notification.sender?.username;

                      return (
                        <div
                          key={notification._id}
                          className="px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          {notification.type === "FOLLOW_REQUEST" && (
                            <>
                              <p className="text-sm text-gray-800">
                                <span className="font-semibold">
                                  {senderName}
                                </span>{" "}
                                wants to follow you
                              </p>
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleNotificationAction(
                                      notification._id,
                                      "accept"
                                    )
                                  }
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleNotificationAction(
                                      notification._id,
                                      "reject"
                                    )
                                  }
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                >
                                  Reject
                                </button>
                              </div>
                            </>
                          )}
                          {notification.type === "NEW_JOB" && (
                            <>
                              <p className="text-sm text-gray-800">
                                <span className="font-semibold">
                                  {senderName}
                                </span>{" "}
                                posted a new job: {notification.jobTitle} at{" "}
                                {notification.company}
                              </p>
                              <div className="mt-2">
                                <button
                                  onClick={() => {
                                    navigate(`/jobs/${notification.jobId}`);
                                    setShowNotifications(false);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  View Job
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
