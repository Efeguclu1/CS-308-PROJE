import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './Products.scss';

const Products = () => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    // For testing, let's use mock data
    const mockProducts = [
      { id: 1, name: "iPhone 15 Pro 256GB", price: 1299.99, stock: 10, description: "Latest iPhone model with advanced features" },
      { id: 2, name: "MacBook Pro M3", price: 1999.99, stock: 5, description: "Powerful laptop with M3 chip" },
      { id: 3, name: "AirPods Pro", price: 249.99, stock: 15, description: "Premium wireless earbuds" },
      { id: 4, name: "iPad Air", price: 599.99, stock: 8, description: "Versatile tablet for work and play" },
      { id: 5, name: "Apple Watch Series 9", price: 399.99, stock: 12, description: "Advanced smartwatch with health features" },
      { id: 6, name: "HomePod Mini", price: 99.99, stock: 20, description: "Compact smart speaker" }
    ];
    setProducts(mockProducts);
  }, []);

  return (
    <Container className="my-4">
      <h2 className="mb-4">Our Products</h2>
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
                  onClick={() => addToCart(product)}
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

export default Products;
