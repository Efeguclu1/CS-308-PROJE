import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  useEffect(() => {
    // Debug bilgisi
    console.log('OrderSuccess - Order ID:', orderId);
    console.log('OrderSuccess - Location state:', location.state);
  }, [orderId, location.state]);

  const handleViewOrders = () => {
    console.log('Navigating to orders page');
    navigate('/orders');
  };

  return (
    <Container className="py-5">
      <Card className="text-center shadow-sm">
        <Card.Body className="p-5">
          <div className="text-success mb-4">
            <FaCheckCircle size={64} />
          </div>
          
          <h1 className="mb-4">Order Successful!</h1>
          
          <p className="text-muted mb-4">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          
          <div className="mb-4">
            <h5>Order ID: #{orderId}</h5>
            <p className="text-muted">
              You will receive an email confirmation shortly.
            </p>
          </div>
          
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="outline-primary"
              onClick={handleViewOrders}
            >
              View Orders
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderSuccess; 