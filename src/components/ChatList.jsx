import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  IconButton,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Group as GroupsIcon,
  AddComment as AddCommentIcon,
} from "@mui/icons-material";
import "../css/ChatList.css";

function ChatList() {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [chatRooms, setChatRooms] = useState([]);

  const fetchChatRooms = useCallback(async () => {
    if (userData && userData.employeeId) {
      try {
        const response = await axios.post("http://localhost:8080/chat/list", {
          employeeId: userData.employeeId,
        });

        const roomsWithLastMessageAndMembers = await Promise.all(
          response.data.map(async (room) => {
            const messagesResponse = await axios.get(
              `http://localhost:8080/chat/roomNum/${room.roomNum}`,
            );
            const lastMessage = messagesResponse.data[messagesResponse.data.length - 1];

            const membersResponse = await axios.get(
              `http://localhost:8080/chat/room/${room.roomNum}/members`,
            );
            const roomMembers = membersResponse.data;

            return { ...room, lastMessage, roomMembers };
          }),
        );

        // 최신 메시지 순으로 채팅방 정렬
        roomsWithLastMessageAndMembers.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
          return dateB - dateA;
        });

        setChatRooms(roomsWithLastMessageAndMembers);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      }
    } else {
      console.log("No data received");
      navigate("/");
    }
  }, [userData, navigate]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  useEffect(() => {
    const eventSources = chatRooms.map((room) => {
      const eventSource = new EventSource(
        `http://localhost:8080/chat/stream/roomNum/${room.roomNum}`,
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        fetchChatRooms(); // 메시지 수신 시마다 최신 데이터로 상태 업데이트
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
      };

      return eventSource;
    });

    return () => {
      eventSources.forEach((eventSource) => eventSource.close());
    };
  }, [chatRooms, fetchChatRooms]);

  const handleRoomClick = (room) => {
    navigate("/chat", {
      state: {
        employeeId: userData.employeeId,
        username: userData.name,
        roomNum: room.roomNum,
        roomName: room.roomName,
        level: userData.level,
        department: userData.department,
      },
    });
  };

  const handleCreateRoomClick = () => {
    navigate("/create-room", {
      userData,
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!userData) {
    return <p>Loading...</p>;
  }

  return (
    <Box>
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, backgroundColor: "#e3f2fd" }}
          boxShadow={2}
        >
          <Box display="flex" alignItems="center">
            <Typography
              variant="h3"
              component="div"
              sx={{ fontWeight: "bold", marginLeft: 1, p: 1.5 }}
            >
              채팅
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Typography variant="h5">
              이름: {userData.name} {userData.department} {userData.levelName}{" "}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <IconButton sx={{ color: "#2e2e2e" }} onClick={handleCreateRoomClick}>
              <AddCommentIcon fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Divider />
      {chatRooms.length > 0 ? (
        <List sx={{ p: 0 }}>
          {chatRooms.map((room, index) => (
            <ListItem
              key={index}
              button
              onClick={() => handleRoomClick(room)}
              sx={{
                borderRadius: 1,
                mb: 0,
                paddingTop: 0,
                backgroundColor: "#ffffff",
                "&:hover": { backgroundColor: "#e0e0e0" },
                p: 3,
                border: "1px solid #ddd",
              }}
            >
              <Grid container>
                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center">
                    <ListItemText
                      primary={room.roomName}
                      primaryTypographyProps={{ variant: "h3", fontWeight: "bold" }}
                    />
                    <PersonIcon color="secondary" sx={{ ml: 2, mb: 0.3 }} />
                    <Typography variant="body1">{room.roomMembers.length}</Typography>
                  </Box>
                  <Box sx={{ marginLeft: 2, textAlign: "right" }}>
                    <Typography variant="body1">
                      {" "}
                      {room.lastMessage && formatDate(room.lastMessage.createdAt)}{" "}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  {room.lastMessage ? (
                    <Typography variant="h5" color="textSecondary" sx={{ pt: 1 }}>
                      <Typography component="span" sx={{ color: "black" }}>
                        {`${room.lastMessage.senderName} ${room.lastMessage.employee.departmentName} ${room.lastMessage.employee.levelName}`}{" "}
                      </Typography>
                      <Typography component="span" sx={{ color: "textSecondary" }}>
                        : {room.lastMessage.msg}
                      </Typography>
                    </Typography>
                  ) : (
                    <Typography variant="h5" color="textSecondary" sx={{ pt: 1 }}>
                      메시지가 없습니다.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          height="70vh"
          sx={{ mt: 4 }}
        >
          <ChatIcon color="action" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" color="textSecondary">
            채팅방이 없습니다.
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            새로운 채팅방을 만들어보세요.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChatList;
