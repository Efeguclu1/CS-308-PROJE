import { useState } from "react";
import axios from "axios";
import { Container, Form, Button, Card, Row, Col, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.scss";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "danger"
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (response && response.data) {
        const { token, userId } = response.data;
        
        // Store token in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        
        setMessage("Login successful! Redirecting to homepage...");
        setMessageType("success");
        
        // Redirect to homepage after successful login
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setMessage("An unexpected error occurred!");
        setMessageType("danger");
      }
    } catch (error) {
      console.error("Login Error:", error);
      
      if (error.response) {
        setMessage("Login failed: " + error.response.data.error);
        setMessageType("danger");
      } else {
        setMessage("Could not connect to server. Is the backend running?");
        setMessageType("danger");
      }
    }
  };

  return (
    <div className="login-page">
      {/* Login header */}
      <div className="checkout-header">
        <Container>
          <Row className="align-items-center py-3">
            <Col className="checkout-logo">
              <Link to="/" className="text-white text-decoration-none">
                <h3><strong>TECH</strong>STORE</h3>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>
      
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Card className="checkout-card shadow border-0">
              <Card.Header className="bg-white border-0 pt-4 pb-0">
                <h2 className="text-center fw-bold mb-0">Welcome Back</h2>
                <p className="text-center text-muted mt-2">Sign in to your account</p>
              </Card.Header>
              <Card.Body className="p-4 p-md-5 pt-md-4">
                {message && (
                  <Alert variant={messageType} className="mb-4">
                    {message}
                  </Alert>
                )}
                
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control 
                      type="email" 
                      className="form-control py-2" 
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>Password</Form.Label>
                      <Link to="/forgot-password" className="checkout-link small">
                        Forgot Password?
                      </Link>
                    </div>
                    <Form.Control 
                      type="password" 
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Check 
                      type="checkbox" 
                      id="remember" 
                      label="Remember me on this device" 
                    />
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="py-2 fw-bold"
                      size="lg"
                    >
                      Login
                    </Button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <p className="mb-0">
                      Don't have an account? {" "}
                      <Link to="/register" className="checkout-link">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
            
            <div className="text-center mt-4">
              <Link to="/" className="text-decoration-none text-muted">
                <i className="bi bi-arrow-left me-1"></i> Back to Home
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
