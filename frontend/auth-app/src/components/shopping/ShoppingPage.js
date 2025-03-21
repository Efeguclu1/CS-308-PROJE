import React, { useState } from 'react';
import { Container, Row, Col, Tab, Nav } from 'react-bootstrap';
import ProductList from './ProductList';
import ShoppingCart from './ShoppingCart';
import Checkout from './Checkout';

const ShoppingPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Container fluid className="py-4">
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="products">Products</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="cart">
                  Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  eventKey="checkout"
                  disabled={cartItems.length === 0}
                >
                  Checkout
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="products">
                <ProductList onAddToCart={handleAddToCart} />
              </Tab.Pane>
              <Tab.Pane eventKey="cart">
                <ShoppingCart
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  onCheckout={() => setActiveTab('checkout')}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="checkout">
                <Checkout cartItems={cartItems} total={total} />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default ShoppingPage; 