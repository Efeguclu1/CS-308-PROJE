import React from 'react';
import { Container, ListGroup, Button, Badge, Card } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { BsTrash, BsDash, BsPlus } from 'react-icons/bs';
import './Cart.scss';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Navigate directly to the checkout page
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <Container className="my-4">
        <div className="text-center py-5">
          <h2>Your cart is empty</h2>
          <p className="mb-4">Visit our products page to start shopping.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Go to Products
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2 className="mb-4">Shopping Cart</h2>
      <div className="cart-page">
        <div className="row">
          <div className="col-lg-8">
            <Card className="mb-4">
              <Card.Body>
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <ListGroup.Item key={item.id} className="cart-item py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="item-details">
                          <h5 className="mb-1">{item.name}</h5>
                          <div className="text-muted">Unit Price: ${item.price}</div>
                        </div>
                        <div className="item-actions d-flex align-items-center">
                          <div className="quantity-controls me-3">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <BsDash />
                            </Button>
                            <span className="mx-3">{item.quantity}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <BsPlus />
                            </Button>
                          </div>
                          <div className="price-column text-end me-3">
                            <div className="fw-bold">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <BsTrash />
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </div>
          <div className="col-lg-4">
            <Card className="mb-4 cart-summary">
              <Card.Body>
                <h5 className="mb-3">Order Summary</h5>
                <div className="summary-items mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax</span>
                    <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
                  </div>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <h5>Total</h5>
                  <h5>
                    <Badge bg="secondary">
                      ${(getCartTotal() * 1.08).toFixed(2)}
                    </Badge>
                  </h5>
                </div>
                <div className="d-grid">
                  <Button variant="primary" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </div>
              </Card.Body>
            </Card>
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                size="sm"
                as={Link} 
                to="/products"
              >
                Continue Shopping
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => cartItems.forEach(item => removeFromCart(item.id))}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Cart; 