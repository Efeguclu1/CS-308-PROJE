import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './Checkout.scss';

const Review = () => {
  const [cartItems, setCartItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart items
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      setCartItems(parsedCart);
      
      // Calculate order total
      const total = parsedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setOrderTotal(total);
    }
    
    // Load shipping information
    const storedShippingInfo = localStorage.getItem('shippingInfo');
    if (storedShippingInfo) {
      setShippingInfo(JSON.parse(storedShippingInfo));
    } else {
      navigate('/checkout/shipping');
    }
    
    // Load payment information
    const storedPaymentInfo = localStorage.getItem('paymentInfo');
    if (storedPaymentInfo) {
      setPaymentInfo(JSON.parse(storedPaymentInfo));
    } else {
      navigate('/checkout/payment');
    }
  }, [navigate]);

  const handlePlaceOrder = () => {
    try {
      // Here you would typically send the order to your backend
      // For now we'll just simulate a successful order

      // Create order object
      const order = {
        items: cartItems,
        total: orderTotal,
        shipping: shippingInfo,
        payment: {
          ...paymentInfo,
          cardNumber: paymentInfo.cardNumber.substring(paymentInfo.cardNumber.length - 4), // Only store last 4 digits
        },
        orderDate: new Date().toISOString(),
        status: 'Processing'
      };
      
      // Store order in localStorage (in a real app, this would go to a database)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Show success message
      setMessage('Order placed successfully! Thank you for your purchase.');
      setMessageType('success');
      
      // Redirect to confirmation page after a delay
      setTimeout(() => {
        navigate('/order-confirmation', { state: { order } });
      }, 2000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      setMessage('There was a problem placing your order. Please try again.');
      setMessageType('danger');
    }
  };

  return (
    <div className="checkout-page">
      {/* Header with checkout steps */}
      <div className="checkout-header">
        <Container>
          <Row className="align-items-center py-3">
            <Col xs={6} md={3} className="checkout-logo">
              <Link to="/" className="text-white text-decoration-none">
                <h3>TechStore</h3>
              </Link>
            </Col>
            <Col xs={6} md={9}>
              <div className="checkout-steps">
                <div className="step completed">
                  <span className="step-number">1</span>
                  <span className="step-text">Sign In</span>
                </div>
                <div className="step-divider completed"></div>
                <div className="step completed">
                  <span className="step-number">2</span>
                  <span className="step-text">Shipping</span>
                </div>
                <div className="step-divider completed"></div>
                <div className="step completed">
                  <span className="step-number">3</span>
                  <span className="step-text">Payment</span>
                </div>
                <div className="step-divider completed"></div>
                <div className="step active">
                  <span className="step-number">4</span>
                  <span className="step-text">Review</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="checkout-container py-4">
        {message && (
          <Alert variant={messageType} className="mb-4">
            {message}
          </Alert>
        )}
        
        <Row>
          <Col lg={8}>
            <Card className="checkout-card mb-4">
              <Card.Header className="bg-white">
                <h4>Review Your Order</h4>
              </Card.Header>
              <Card.Body>
                {shippingInfo && (
                  <div className="mb-4">
                    <h5>Shipping Information</h5>
                    <p className="mb-1">
                      <strong>{shippingInfo.firstName} {shippingInfo.lastName}</strong>
                    </p>
                    <p className="mb-1">{shippingInfo.address}</p>
                    <p className="mb-1">
                      {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                    </p>
                    <p className="mb-1">{shippingInfo.country}</p>
                    <p className="mb-0">{shippingInfo.phoneNumber}</p>
                    
                    <div className="mt-2">
                      <Link to="/checkout/shipping" className="checkout-link">Edit</Link>
                    </div>
                  </div>
                )}
                
                <hr />
                
                {paymentInfo && (
                  <div className="mb-4">
                    <h5>Payment Information</h5>
                    <p className="mb-1">
                      <strong>{paymentInfo.nameOnCard}</strong>
                    </p>
                    <p className="mb-1">
                      Card ending in {paymentInfo.cardNumber.substring(paymentInfo.cardNumber.length - 4)}
                    </p>
                    <p className="mb-0">
                      Expires {paymentInfo.expirationMonth}/{paymentInfo.expirationYear}
                    </p>
                    
                    <div className="mt-2">
                      <Link to="/checkout/payment" className="checkout-link">Edit</Link>
                    </div>
                  </div>
                )}
                
                <hr />
                
                <div>
                  <h5>Shipping Method</h5>
                  <p className="mb-0">Standard Shipping (3-5 business days)</p>
                </div>
              </Card.Body>
            </Card>
            
            <div className="d-flex justify-content-between mb-4">
              <Link to="/checkout/payment" className="btn btn-outline-secondary">
                Back to Payment
              </Link>
              <Button 
                variant="primary" 
                onClick={handlePlaceOrder}
                className="checkout-button"
              >
                Place Order
              </Button>
            </div>
          </Col>
          
          <Col lg={4}>
            <Card className="checkout-summary-card">
              <Card.Header className="bg-white">
                <h4>Order Summary</h4>
              </Card.Header>
              <Card.Body>
                {cartItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p>Your cart is empty</p>
                    <Link to="/products" className="btn btn-outline-primary">
                      Go to Products
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="summary-items mb-3">
                      {cartItems.map((item, index) => (
                        <div key={index} className="summary-item d-flex justify-content-between mb-2">
                          <div>
                            <p className="mb-0">{item.name}</p>
                          </div>
                          <div className="text-end">
                            <p className="mb-0">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Shipping</span>
                      <span>$0.00</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax</span>
                      <span>${(orderTotal * 0.08).toFixed(2)}</span>
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between">
                      <strong>Total</strong>
                      <strong>${(orderTotal + (orderTotal * 0.08)).toFixed(2)}</strong>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Review; 