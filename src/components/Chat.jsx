import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useUser } from "../context/UserContext";
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  IconButton,
  Paper,
  Checkbox,
  Avatar,
} from "@mui/material";
import {
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
  List as ListIcon,
} from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import "../css/Chat.css";

// Modal 접근성 개선을 위해 앱 요소 설정
Modal.setAppElement("#root");

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const { employeeId, username, roomNum, roomName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const chatBoxRef = useRef(null);
  const eventSourceRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const isSendingRef = useRef(false);

  const fetchInitialMessages = useCallback(async (roomNum) => {
    try {
      const response = await axios.get(`http://localhost:8080/chat/roomNum/${roomNum}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, []);

  const setupEventSource = useCallback(
    (roomNum) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      eventSourceRef.current = new EventSource(
        `http://localhost:8080/chat/stream/roomNum/${roomNum}`,
      );
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.sender !== employeeId || data.id !== lastMessageIdRef.current) {
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === data.id)) {
              return prevMessages;
            }
            return [...prevMessages, data];
          });
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSourceRef.current.close();
        setupEventSource(roomNum);
      };
    },
    [employeeId],
  );

  useEffect(() => {
    if (employeeId && roomNum) {
      fetchInitialMessages(roomNum);
      setupEventSource(roomNum);
      fetchRoomMembers(roomNum);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [employeeId, roomNum, fetchInitialMessages, setupEventSource]);

  const fetchRoomMembers = async (roomNum) => {
    try {
      const response = await axios.get(`http://localhost:8080/chat/room/${roomNum}/members`);
      setRoomMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch room members:", error);
    }
  };

  const fetchChatRooms = async () => {
    try {
      const response = await axios.post("http://localhost:8080/chat/rooms", {
        params: { employeeId: userData.employeeId },
      });
      if (response.status === 200) {
        setUserData((prevData) => ({ ...prevData, chatRooms: response.data }));
      } else {
        console.error("Failed to fetch chat rooms");
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message || isSendingRef.current) return;

    isSendingRef.current = true;

    const chat = {
      sender: employeeId,
      roomNum,
      msg: message,
      senderName: username,
    };

    try {
      const response = await axios.post("http://localhost:8080/chat", chat);
      const savedChat = response.data;
      lastMessageIdRef.current = savedChat.id;
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const openModal = async () => {
    try {
      const response = await axios.get("http://localhost:8080/chat/employees");
      setEmployees(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployees([]);
  };

  const handleEmployeeSelect = (id) => {
    setSelectedEmployees((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((empId) => empId !== id)
        : [...prevSelected, id],
    );
  };

  const handleInviteEmployees = async () => {
    try {
      await axios.post("http://localhost:8080/chat/invite", {
        roomNum,
        employeeIds: selectedEmployees,
      });
      alert("초대 완료");
      closeModal();
      await fetchChatRooms(); // 초대 후 채팅방 목록 업데이트
      await fetchRoomMembers(roomNum); // 초대 후 방 구성원 업데이트
    } catch (error) {
      console.error("Failed to invite employees:", error);
      alert("초대 실패");
    }
  };

  const openList = async () => {
    navigate("/chat/list");
  };

  const handleLeaveRoom = async () => {
    if (window.confirm("정말 이 방에서 나가시겠습니까?")) {
      try {
        await axios.post("http://localhost:8080/chat/leave", {
          roomNum,
          employeeId,
        });
        alert("방에서 나갔습니다.");

        if (userData && userData.chatRooms) {
          const updatedChatRooms = userData.chatRooms.filter((room) => room.roomNum !== roomNum);
          const updatedData = { ...userData, chatRooms: updatedChatRooms };
          setUserData(updatedData);
          fetchChatRooms();
          navigate("/chat/list");
        } else {
          navigate("/chat/list");
        }
      } catch (error) {
        console.error("Failed to leave room:", error);
        alert("방 나가기 실패");
      }
    }
  };

  if (!username || !roomNum) {
    return <p>Loading...</p>;
  }

  return (
    <Box>
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, mb: 0.5, backgroundColor: "#e3f2fd" }}
          boxShadow={2}
        >
          <Box display="flex" alignItems="center">
            <IconButton sx={{ color: "2e2e2e" }} onClick={openList}>
              <ListIcon sx={{ width: "33px", height: "33px" }} />
            </IconButton>
            <Typography variant="h3" component="div" sx={{ fontWeight: "bold", marginLeft: 1 }}>
              {roomName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton sx={{ color: "2e2e2e" }} onClick={openModal}>
              <PersonAddIcon />
            </IconButton>
            <IconButton sx={{ color: "2e2e2e" }} color="secondary" onClick={handleLeaveRoom}>
              <ExitToAppIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          ref={chatBoxRef}
          sx={{ minHeight: "80vh", maxHeight: "80vh", overflowY: "auto", marginBottom: 2 }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === employeeId ? "flex-end" : "flex-start",
                marginBottom: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  pr: msg.sender === employeeId ? 7 : 0,
                  pl: msg.sender !== employeeId ? 7 : 0,
                  color: "#5a5757",
                }}
              >
                <b>
                  {msg.senderName}{" "}
                  {msg.employee
                    ? `${msg.employee.departmentName || "N/A"} ${msg.employee.levelName || "N/A"}`
                    : ""}
                </b>
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {msg.sender !== employeeId && (
                  <Avatar sx={{ width: 35, height: 35, mr: 1, ml: 1 }}>
                    <PersonIcon />
                  </Avatar>
                )}
                <Paper
                  elevation={2}
                  sx={{
                    padding: 1,
                    backgroundColor: msg.sender === employeeId ? "#e3f2fd" : "#fff",
                    border: msg.sender === employeeId ? "none" : "1px solid #ddd",
                    display: "inline-block",
                    maxWidth: "500px", // 너비 제한 추가
                    wordWrap: "break-word", // 줄 바꿈 속성 추가
                  }}
                >
                  <Typography variant="body1">{msg.msg}</Typography>
                </Paper>
                {msg.sender === employeeId && (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 1,
                      ml: 1,
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                )}
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  mt: 0.5,
                  pr: msg.sender === employeeId ? 7 : 0,
                  pl: msg.sender !== employeeId ? 7 : 0,
                }}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box display="flex">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="메시지를 입력하세요."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            InputProps={{
              endAdornment: (
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Box>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Invite Employees"
        className="Modal"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "700px",
            padding: "20px",
            overflow: "hidden",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)", // 배경 어둡게 조정
          },
        }}
      >
        <Typography variant="h2" component="h2" gutterBottom>
          직원 초대
        </Typography>
        <Box sx={{ overflowY: "auto", maxHeight: "calc(100% - 120px)", padding: "10px" }}>
          <Grid container spacing={2}>
            {employees.map((employee) => {
              const isMember = roomMembers.some(
                (member) => member.employeeId === employee.employeeId,
              );
              return (
                <Grid item xs={12} key={employee.employeeId}>
                  <Paper
                    elevation={isMember ? 1 : 3}
                    sx={{
                      padding: 2,
                      backgroundColor: isMember ? "#e0e0e0" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "8px",
                    }}
                  >
                    <Checkbox
                      value={employee.employeeId}
                      onChange={() => handleEmployeeSelect(employee.employeeId)}
                      disabled={isMember}
                      sx={{ marginRight: 2 }}
                    />
                    <Box>
                      <Typography variant="body1">
                        {employee.name} {employee.departmentName || "N/A"}{" "}
                        {employee.levelName || "N/A"}
                      </Typography>
                      {isMember && (
                        <Typography variant="body2" color="textSecondary">
                          (참여 중)
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        <Box sx={{ textAlign: "right", marginTop: 2 }}>
          <Button
            onClick={handleInviteEmployees}
            color="primary"
            variant="contained"
            sx={{ marginRight: 1 }}
          >
            초대
          </Button>
          <Button onClick={closeModal} color="secondary" variant="outlined">
            취소
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Chat;
