import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Form, Spinner } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Products.scss';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(0); // 0 means all categories
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Function to fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch products by category
  const fetchProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/products/category/${categoryId}`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching products by category. Please try again later.');
      console.error('Error fetching products by category:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to search products
  const searchProducts = async (query) => {
    if (!query.trim()) {
      fetchProducts();
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/products/search/${query}`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Error searching products. Please try again later.');
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products/categories/all');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Parse URL parameters on mount and URL change
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    const searchParam = queryParams.get('search');
    
    if (categoryParam) {
      const categoryId = parseInt(categoryParam);
      setSelectedCategory(categoryId);
      fetchProductsByCategory(categoryId);
    } else if (searchParam) {
      setSearchQuery(searchParam);
      searchProducts(searchParam);
    } else {
      setSelectedCategory(0);
      fetchProducts();
    }
  }, [location.search]);

  // Handle category change
  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value);
    setSelectedCategory(categoryId);
    
    if (categoryId === 0) {
      navigate('/products');
    } else {
      navigate(`/products?category=${categoryId}`);
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/products');
      return;
    }
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  // Navigate to product details
  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <Container className="my-4 products-container">
      <h2 className="mb-4 text-center">Our Products</h2>
      
      <Row className="mb-4">
        <Col md={6}>
          <Form onSubmit={handleSearchSubmit}>
            <Form.Group className="d-flex">
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Button variant="primary" type="submit" className="ms-2">
                Search
              </Button>
            </Form.Group>
          </Form>
        </Col>
        <Col md={6}>
          <Form.Select 
            value={selectedCategory} 
            onChange={handleCategoryChange}
          >
            <option value={0}>All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : products.length === 0 ? (
        <div className="alert alert-info">No products found.</div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {products.map((product) => (
            <Col key={product.id}>
              <Card className="h-100 shadow-sm product-card">
                {product.stock <= 5 && (
                  <div className="low-stock-badge">Low Stock</div>
                )}
                <Card.Body>
                  <Card.Title 
                    className="product-title-link"
                    onClick={() => handleViewDetails(product.id)}
                  >
                    {product.name}
                  </Card.Title>
                  <Card.Text className="product-description">{product.description}</Card.Text>
                  <div className="product-details">
                    <div><strong>Model:</strong> {product.model}</div>
                    <div><strong>Warranty:</strong> {product.warranty_months} months</div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Badge bg="primary" className="price-badge">${product.price}</Badge>
                    <Badge bg={product.stock > 0 ? "secondary" : "danger"} className="stock-badge">
                      {product.stock > 0 ? `Stock: ${product.stock}` : "Out of Stock"}
                    </Badge>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Button 
                      variant="outline-secondary" 
                      className="flex-grow-1"
                      onClick={() => handleViewDetails(product.id)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      className="flex-grow-1"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Products;
