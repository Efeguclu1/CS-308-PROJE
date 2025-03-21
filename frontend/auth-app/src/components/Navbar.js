import { useState } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useCart } from '../context/CartContext';
import './Navbar.scss';

const NavigationBar = () => {
  const [expanded, setExpanded] = useState(false);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

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
                  placeholder="What are you looking for?"
                  aria-label="Search"
                />
                <Button variant="light">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>
            
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/products" className="nav-link">
                <i className="bi bi-grid"></i> Products
              </Nav.Link>
              <Nav.Link as={Link} to="/login" className="nav-link">
                <i className="bi bi-person"></i> Login
              </Nav.Link>
              <Nav.Link as={Link} to="/cart" className="nav-link cart-link position-relative">
                <div>
                  <i className="bi bi-cart"></i>
                  <span className="ms-1">Cart</span>
                </div>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Categories Menu */}
      <div className="categories-menu">
        <Container>
          <Nav className="categories-nav">
            <Nav.Link as={Link} to="/products/computers">Computers</Nav.Link>
            <Nav.Link as={Link} to="/products/phones">Phones</Nav.Link>
            <Nav.Link as={Link} to="/products/tv">TV & Display</Nav.Link>
            <Nav.Link as={Link} to="/products/audio">Audio</Nav.Link>
            <Nav.Link as={Link} to="/products/accessories">Accessories</Nav.Link>
            <Nav.Link as={Link} to="/products/gaming">Gaming</Nav.Link>
            <Nav.Link as={Link} to="/products/wearables">Wearable Technology</Nav.Link>
          </Nav>
        </Container>
      </div>
    </>
  );
};

export default NavigationBar;
