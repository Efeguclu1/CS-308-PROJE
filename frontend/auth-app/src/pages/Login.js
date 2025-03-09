import { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from "react-bootstrap";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      setMessage("Giriş başarılı!");
    } catch (error) {
      setMessage("Giriş başarısız: " + error.response.data.error);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center">Giriş Yap</h2>
      <Form onSubmit={handleLogin}>
        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Şifre</Form.Label>
          <Form.Control type="password" onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Button className="mt-3" variant="primary" type="submit">Giriş Yap</Button>
      </Form>
      <p className="text-center mt-3">{message}</p>
    </Container>
  );
};

export default Login;
