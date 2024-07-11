import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import "../css/Login.css";
import {
  Box,
  Button,
  Checkbox,
  Container,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";

function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const navigate = useNavigate();
  const { setUserData } = useUser();
  const employeeIdRef = useRef(null);
  const [rememberMe, setRememberMe] = useState(false);
  const location = useLocation();

  useEffect(() => {
    employeeIdRef.current.focus();
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get("employeeId");
    if (idFromUrl) {
      setEmployeeId(idFromUrl);
    }
  }, [location]);

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8080/chat/login", {
        employeeId,
        employeePassword,
      });

      if (response.status === 200 && response.data.chatRooms) {
        alert("로그인 성공");
        setUserData(response.data);
        console.log(response.data);
        navigate("/chat/list");
      } else {
        alert("로그인 실패");
      }
    } catch (error) {
      alert("로그인 실패");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: 5,
          p: 4,
          borderRadius: 2,
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
            Intranet
          </Typography>
          <Typography variant="h3" color="textSecondary">
            메신저
          </Typography>
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          margin="normal"
          label="Username"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <TextField
          fullWidth
          variant="outlined"
          margin="normal"
          label="Password"
          type="password"
          value={employeePassword}
          onChange={(e) => setEmployeePassword(e.target.value)}
          onKeyPress={handleKeyPress}
          ref={employeeIdRef}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
          label="아이디 저장"
        />
        <Button fullWidth variant="contained" color="primary" onClick={handleLogin} sx={{ mt: 2 }}>
          로그인
        </Button>
      </Box>
    </Container>
  );
}

export default Login;
