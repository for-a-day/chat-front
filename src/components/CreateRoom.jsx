import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../css/CreateRoom.css";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  Paper,
} from "@mui/material";

function CreateRoom() {
  const navigate = useNavigate();
  const { userData, setUserData } = useUser();
  const [roomName, setRoomName] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(null);
  const roomCreationInProgress = useRef(false);

  useEffect(() => {
    if (userData && userData.employees) {
      console.log("User data employees:", userData.employees); // 확인용 로그
      setEmployees(userData.employees);
      setLoggedInEmployeeId(userData.employeeId);
      setSelectedEmployees([userData.employeeId]);
    }
  }, [userData]);

  const openList = async () => {
    navigate("/chat/list");
  };

  const handleCreateRoom = async () => {
    if (!roomName || selectedEmployees.length === 0) {
      alert("방 이름과 초대할 인원을 선택하세요.");
      return;
    }

    if (roomCreationInProgress.current) {
      return;
    }
    roomCreationInProgress.current = true;

    try {
      const response = await axios.post("http://localhost:8080/chat/rooms", {
        roomName,
        employeeIds: selectedEmployees,
      });

      if (response.status === 200) {
        alert("방이 생성되었습니다.");
        const newChatRoom = response.data;
        const updatedChatRooms = [...userData.chatRooms, newChatRoom];
        const updatedData = { ...userData, chatRooms: updatedChatRooms };
        setUserData(updatedData);
        navigate("/chat/list");
      } else {
        alert("방 생성에 실패했습니다.");
      }
    } catch (error) {
      alert("방 생성에 실패했습니다.");
    } finally {
      roomCreationInProgress.current = false;
    }
  };

  const handleEmployeeSelect = (id) => {
    setSelectedEmployees((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((empId) => empId !== id)
        : [...prevSelected, id],
    );
  };

  return (
    <Paper sx={{ padding: 4, maxWidth: 600, margin: "auto", marginTop: 4, boxShadow: 3 }}>
      <Typography variant="h3" component="h2" gutterBottom>
        방 생성
      </Typography>
      <Box component="form" noValidate autoComplete="off">
        <TextField
          fullWidth
          margin="normal"
          label="방 이름"
          variant="outlined"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
          직원 초대
        </Typography>
        <Box sx={{ overflowY: "auto", maxHeight: 600, mb: 2 }}>
          <Grid container spacing={2}>
            {employees.map(
              (employee) =>
                employee.employeeId !== loggedInEmployeeId && (
                  <Grid item xs={12} key={employee.employeeId}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedEmployees.includes(employee.employeeId)}
                          onChange={() => handleEmployeeSelect(employee.employeeId)}
                        />
                      }
                      label={`${employee.name} ${employee.departmentName || "N/A"} ${
                        employee.levelName || "N/A"
                      }`}
                    />
                  </Grid>
                ),
            )}
          </Grid>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateRoom}
            sx={{ marginRight: 1 }}
          >
            방 생성
          </Button>
          <Button variant="outlined" color="secondary" onClick={openList}>
            취소
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default CreateRoom;
