import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

// Add notification sound
const notificationSound = new Audio("/notification.mp3");

const UserList = () => {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  const playNotificationSound = () => {
    notificationSound
      .play()
      .catch((err) => console.log("Audio play failed:", err));
  };

  useEffect(() => {
    if (!user) return;

    fetchUsers();

    // Set up Socket.IO connection
    const socket = io("http://localhost:3002", {
      withCredentials: true,
    });

    setSocket(socket);

    // Listen for new user registrations
    socket.on("newUser", (newUser) => {
      setUsers((prevUsers) => {
        if (
          newUser._id !== user._id &&
          !prevUsers.find((u) => u._id === newUser._id)
        ) {
          return [...prevUsers, { ...newUser, followStatus: null }];
        }
        return prevUsers;
      });
    });

    // Listen for follow status updates
    socket.on("followStatusUpdate", ({ following, followers }) => {
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((u) => {
          const wasFollowing = u.followStatus === "following";
          const isNowFollowing = following.includes(u._id);

          // Play sound if follow status changed
          if (wasFollowing !== isNowFollowing) {
            playNotificationSound();
            if (isNowFollowing) {
              toast.success(`You are now following ${u.username}`);
            }
          }

          return {
            ...u,
            followStatus: following.includes(u._id)
              ? "following"
              : u.followStatus,
          };
        });
        return updatedUsers;
      });
    });

    // Join user's room for real-time updates
    socket.emit("joinUser", user._id);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3002/api/users", {
        withCredentials: true,
      });
      // Filter out the current user from the list
      const filteredUsers = response.data.filter((u) => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      toast.error("Error fetching users");
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(
        "http://localhost:3002/api/follow/request",
        {
          recipientId: userId,
        },
        { withCredentials: true }
      );
      // Update the local state to reflect the pending request
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, followStatus: "pending" } : u
        )
      );
      toast.success("Follow request sent!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error sending follow request"
      );
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await axios.delete("http://localhost:3002/api/follow", {
        data: {
          recipientId: userId,
        },
        withCredentials: true,
      });
      // Update the local state to reflect the unfollow
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, followStatus: null } : u
        )
      );

      // Emit socket event for real-time update
      if (socket) {
        socket.emit("followStatusUpdate", {
          userId: user._id,
          targetId: userId,
          status: null,
        });
      }

      toast.success("Successfully unfollowed user");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error unfollowing user");
    }
  };

  const getFollowButtonText = (followStatus) => {
    switch (followStatus) {
      case "following":
        return "Unfollow";
      case "pending":
        return "Pending";
      default:
        return "Follow";
    }
  };

  const getFollowButtonStyle = (followStatus) => {
    switch (followStatus) {
      case "following":
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 cursor-not-allowed";
      default:
        return "bg-blue-500 text-white hover:bg-blue-600";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Users</h2>
      {users.length === 0 ? (
        <p className="text-gray-500 text-center">No other users found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((otherUser) => (
            <div
              key={otherUser._id}
              className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <img
                  src={
                    otherUser.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      otherUser.username
                    )}`
                  }
                  alt={otherUser.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-semibold">{otherUser.username}</h3>
                  <p className="text-sm text-gray-500">{otherUser.email}</p>
                </div>
              </div>
              <button
                onClick={() =>
                  otherUser.followStatus === "following"
                    ? handleUnfollow(otherUser._id)
                    : otherUser.followStatus !== "pending"
                    ? handleFollow(otherUser._id)
                    : null
                }
                disabled={otherUser.followStatus === "pending"}
                className={`px-4 py-2 rounded-md ${getFollowButtonStyle(
                  otherUser.followStatus
                )}`}
              >
                {getFollowButtonText(otherUser.followStatus)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
