import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import ProductReviews from '../products/ProductReviews';
import AddReview from '../products/AddReview';
import axios from 'axios';
import './ProductDetails.scss';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/products/${id}`);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        setError('Error fetching product details. Please try again later.');
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    // Show some kind of notification or feedback here
  };

  const handleReviewAdded = () => {
    // Trigger a refresh of the reviews
    setRefreshReviews(prev => prev + 1);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="my-5">
        <div className="alert alert-info">Product not found.</div>
      </Container>
    );
  }

  return (
    <Container className="my-5 product-details-container">
      <Button 
        variant="outline-secondary" 
        className="mb-4 back-button"
        onClick={() => navigate('/products')}
      >
        &larr; Back to Products
      </Button>

      <Card className="product-detail-card mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="product-info">
              <h1 className="product-title">{product.name}</h1>
              
              <div className="product-price-stock">
                <Badge bg="primary" className="price-badge">${product.price}</Badge>
                <Badge bg={product.stock > 0 ? "success" : "danger"} className="stock-badge">
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
                {product.stock <= 5 && product.stock > 0 && (
                  <Badge bg="warning" text="dark" className="low-stock-badge">Only {product.stock} left</Badge>
                )}
              </div>
              
              <p className="product-description">{product.description}</p>
              
              <ListGroup variant="flush" className="product-specs">
                <ListGroup.Item>
                  <strong>Model:</strong> {product.model}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Serial Number:</strong> {product.serial_number}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Warranty:</strong> {product.warranty_months} months
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Distributor:</strong> {product.distributor_info}
                </ListGroup.Item>
              </ListGroup>
              
              <Button 
                variant="primary" 
                size="lg" 
                className="add-to-cart-btn mt-4"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </Col>
            
            <Col md={6} className="product-image-section">
              <div className="product-placeholder-image">
                <div className="placeholder-text">Product Image</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="reviews" id="product-tabs" className="mb-3">
        <Tab eventKey="reviews" title="Reviews">
          <ProductReviews 
            productId={id} 
            key={`reviews-${refreshReviews}`}  
          />
          <AddReview 
            productId={id} 
            onReviewAdded={handleReviewAdded} 
          />
        </Tab>
        <Tab eventKey="specifications" title="Specifications">
          <Card>
            <Card.Body>
              <h3>Product Specifications</h3>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Model:</strong> {product.model}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Warranty:</strong> {product.warranty_months} months
                </ListGroup.Item>
                {product.serial_number && (
                  <ListGroup.Item>
                    <strong>Serial Number:</strong> {product.serial_number}
                  </ListGroup.Item>
                )}
                {product.distributor_info && (
                  <ListGroup.Item>
                    <strong>Distributor Information:</strong> {product.distributor_info}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ProductDetails; 