import { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.scss';

const NavigationBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const cartCount = getCartCount();
  const navigate = useNavigate();

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products/categories/all');
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.elements.search.value;
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setExpanded(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  // Navigate to category products
  const navigateToCategory = (categoryId, categoryName) => {
    navigate(`/products?category=${categoryId}`, { state: { categoryName } });
    setExpanded(false);
  };

  // Map category name to id for the hardcoded navigation
  const getCategoryMapping = () => {
    const mapping = {
      "computers": categories.find(c => c.name.toLowerCase().includes("computer"))?.id,
      "phones": categories.find(c => c.name.toLowerCase().includes("smartphone"))?.id,
      "tv": categories.find(c => c.name.toLowerCase().includes("electronic"))?.id,
      "audio": categories.find(c => c.name.toLowerCase().includes("electronic"))?.id,
      "accessories": categories.find(c => c.name.toLowerCase().includes("electronic"))?.id,
      "gaming": categories.find(c => c.name.toLowerCase().includes("electronic"))?.id,
      "wearables": categories.find(c => c.name.toLowerCase().includes("electronic"))?.id,
    };
    return mapping;
  };

  const categoryMapping = getCategoryMapping();

  // Check if user is a product manager
  const isProductManager = user && user.role === 'product_manager';

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" className="py-2 navbar-main" expanded={expanded} onToggle={setExpanded}>
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            <strong>TECH</strong>STORE
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Form className="d-flex search-form mx-auto" onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  placeholder="What are you looking for?"
                  aria-label="Search"
                  name="search"
                />
                <Button variant="light" type="submit">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>
            
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/products" className="nav-link">
                <i className="bi bi-grid"></i> Products
              </Nav.Link>
              
              {user ? (
                <>
                  <NavDropdown 
                    title={
                      <span>
                        <i className="bi bi-person-circle"></i> {user.name}
                      </span>
                    } 
                    id="user-dropdown"
                  >
                    <NavDropdown.Item as={Link} to="/orders">
                      <i className="bi bi-box"></i> My Orders
                    </NavDropdown.Item>
                    
                    {isProductManager && (
                      <>
                        <NavDropdown.Divider />
                        <NavDropdown.Item as={Link} to="/admin/review-approval">
                          <i className="bi bi-check-square"></i> Review Approval
                        </NavDropdown.Item>
                      </>
                    )}
                    
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <Nav.Link as={Link} to="/login" className="nav-link">
                  <i className="bi bi-person"></i> Login
                </Nav.Link>
              )}
              
              <Nav.Link as={Link} to="/cart" className="nav-link cart-link position-relative">
                <div>
                  <i className="bi bi-cart"></i>
                  <span className="ms-1">Cart</span>
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </div>
              </Nav.Link>
              <Nav.Link as={Link} to="/profile">
                <i className="fas fa-user"></i> Profile
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Categories Menu */}
      <div className="categories-menu">
        <Container>
          <Nav className="categories-nav">
            <Nav.Link 
              onClick={() => categoryMapping.computers && navigateToCategory(categoryMapping.computers, "Computers")}
              as={categoryMapping.computers ? "button" : Link} 
              to={categoryMapping.computers ? undefined : "/products"}
            >
              Computers
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.phones && navigateToCategory(categoryMapping.phones, "Phones")}
              as={categoryMapping.phones ? "button" : Link} 
              to={categoryMapping.phones ? undefined : "/products"}
            >
              Phones
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.tv && navigateToCategory(categoryMapping.tv, "TV & Display")}
              as={categoryMapping.tv ? "button" : Link} 
              to={categoryMapping.tv ? undefined : "/products"}
            >
              TV & Display
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.audio && navigateToCategory(categoryMapping.audio, "Audio")}
              as={categoryMapping.audio ? "button" : Link} 
              to={categoryMapping.audio ? undefined : "/products"}
            >
              Audio
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.accessories && navigateToCategory(categoryMapping.accessories, "Accessories")}
              as={categoryMapping.accessories ? "button" : Link} 
              to={categoryMapping.accessories ? undefined : "/products"}
            >
              Accessories
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.gaming && navigateToCategory(categoryMapping.gaming, "Gaming")}
              as={categoryMapping.gaming ? "button" : Link} 
              to={categoryMapping.gaming ? undefined : "/products"}
            >
              Gaming
            </Nav.Link>
            <Nav.Link 
              onClick={() => categoryMapping.wearables && navigateToCategory(categoryMapping.wearables, "Wearable Technology")}
              as={categoryMapping.wearables ? "button" : Link} 
              to={categoryMapping.wearables ? undefined : "/products"}
            >
              Wearable Technology
            </Nav.Link>
          </Nav>
        </Container>
      </div>
    </>
  );
};

export default NavigationBar;
