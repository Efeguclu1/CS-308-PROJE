import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import './ProductDetails.scss';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching product details for ID: ${id}`);
        const response = await axios.get(`http://localhost:5001/api/products/${id}`);
        console.log('Product data received:', response.data);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Error fetching product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      alert('Product added to cart!');
    }
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
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="my-5">
        <Alert variant="info">Product not found.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Button 
        variant="outline-secondary" 
        className="mb-4"
        onClick={() => navigate('/products')}
      >
        &larr; Back to Products
      </Button>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h1 className="mb-3">{product.name}</h1>
              <Badge bg="primary" className="mb-3 p-2 fs-5">${product.price}</Badge>
              <p className="fs-5 mb-4">{product.description}</p>
              
              <div className="mb-4">
                <p><strong>Model:</strong> {product.model}</p>
                <p><strong>Serial Number:</strong> {product.serial_number}</p>
                <p><strong>Warranty:</strong> {product.warranty_months} months</p>
                <p><strong>Stock:</strong> {product.stock}</p>
              </div>
              
              <Button 
                variant="primary" 
                size="lg" 
                className="w-100"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </Col>
            
            <Col md={6} className="text-center">
              <div style={{ 
                width: '100%', 
                height: '300px', 
                background: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span className="text-muted">Product Image</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductDetails; 