import { useState } from "react";
import axios from "axios";
import { Container, Form, Button, Card, Row, Col, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import './Auth.scss';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "danger"
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords don't match!");
      setMessageType("danger");
      return;
    }
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });

      if (response && response.data) {
        setMessage("Registration successful! Redirecting to login...");
        setMessageType("success");
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setMessage("An unexpected error occurred!");
        setMessageType("danger");
      }
    } catch (error) {
      console.error("Register Error:", error);

      if (error.response) {
        setMessage("Registration failed: " + error.response.data.error);
        setMessageType("danger");
      } else {
        setMessage("Could not connect to server. Is the backend running?");
        setMessageType("danger");
      }
    }
  };

  return (
    <div className="register-page">
      {/* Register header */}
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
                <h2 className="text-center fw-bold mb-0">Create Account</h2>
                <p className="text-center text-muted mt-2">Join TechStore today</p>
              </Card.Header>
              <Card.Body className="p-4 p-md-5 pt-md-4">
                {message && (
                  <Alert variant={messageType} className="mb-4">
                    {message}
                  </Alert>
                )}
                
                <Form onSubmit={handleRegister}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control 
                      type="text" 
                      className="form-control py-2" 
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                    />
                  </Form.Group>
                  
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
                    <Form.Label>Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                    <Form.Text className="text-muted small">
                      Your password must be at least 8 characters long.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Check 
                      type="checkbox" 
                      id="terms" 
                      label={
                        <span>
                          I accept the <Link to="/terms" className="checkout-link">Terms of Use</Link> and <Link to="/privacy" className="checkout-link">Privacy Policy</Link>
                        </span>
                      } 
                      required
                    />
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="py-2 fw-bold"
                      size="lg"
                    >
                      Register
                    </Button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <p className="mb-0">
                      Already have an account? {" "}
                      <Link to="/login" className="checkout-link">
                        Login
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

export default Register;
