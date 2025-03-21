import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Badge, Button } from 'react-bootstrap';
import axios from 'axios';

const ProductList = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // TODO: Replace with actual API endpoint
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <Container className="my-4">
      <h2 className="mb-4">Product Listing</h2>
      <Row xs={1} md={2} lg={3} className="g-4">
        {products.map((product) => (
          <Col key={product.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>{product.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg="primary">${product.price}</Badge>
                  <Badge bg="secondary">Stock: {product.stock}</Badge>
                </div>
                <Button 
                  variant="outline-primary" 
                  className="w-100 mt-3"
                  onClick={() => onAddToCart(product)}
                >
                  Add to Cart
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProductList; 