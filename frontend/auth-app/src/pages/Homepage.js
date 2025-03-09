import { Container, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <Container className="text-center">
      <h1 className="mt-5">Hoş Geldiniz!</h1>
      <p>Online mağazamıza göz atın ve en iyi ürünleri keşfedin.</p>
      <Row className="mt-4">
        <Col>
          <Link to="/products">
            <Button variant="primary" size="lg">Ürünleri Gör</Button>
          </Link>
        </Col>
        <Col>
          <Link to="/login">
            <Button variant="success" size="lg">Giriş Yap</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default Homepage;
