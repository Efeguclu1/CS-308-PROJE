import { useState } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import './Navbar.scss';

const NavigationBar = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="py-2 navbar-main" expanded={expanded} onToggle={setExpanded}>
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            <strong>TECH</strong>STORE
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Form className="d-flex search-form mx-auto">
              <InputGroup>
                <Form.Control
                  placeholder="Ne aramıştınız?"
                  aria-label="Search"
                />
                <Button variant="light">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>
            
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/products" className="nav-link">
                <i className="bi bi-grid"></i> Ürünler
              </Nav.Link>
              <Nav.Link as={Link} to="/login" className="nav-link">
                <i className="bi bi-person"></i> Giriş
              </Nav.Link>
              <Nav.Link as={Link} to="/cart" className="nav-link">
                <i className="bi bi-cart"></i> Sepet
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Categories Menu */}
      <div className="categories-menu">
        <Container>
          <Nav className="categories-nav">
            <Nav.Link as={Link} to="/products/computers">Bilgisayarlar</Nav.Link>
            <Nav.Link as={Link} to="/products/phones">Telefonlar</Nav.Link>
            <Nav.Link as={Link} to="/products/tv">TV & Görüntü</Nav.Link>
            <Nav.Link as={Link} to="/products/audio">Ses</Nav.Link>
            <Nav.Link as={Link} to="/products/accessories">Aksesuarlar</Nav.Link>
            <Nav.Link as={Link} to="/products/gaming">Gaming</Nav.Link>
            <Nav.Link as={Link} to="/products/wearables">Giyilebilir Teknoloji</Nav.Link>
          </Nav>
        </Container>
      </div>
    </>
  );
};

export default NavigationBar;
