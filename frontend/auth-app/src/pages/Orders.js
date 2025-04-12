import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../utils/auth';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);

  const fetchOrders = async () => {
    if (!user || !user.id) return;

    setLoading(true);
    setError('');
    console.log('Fetching orders for user ID:', user.id);
    
    try {
      // Token will be automatically added by axios interceptor
      const response = await axios.get(`http://localhost:5001/api/orders/user/${user.id}`);
      console.log('Orders response:', response.data);
      
      // Store the response as array or empty array
      setOrders(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Status code:', err.response.status);
        
        if (err.response.status === 401) {
          setError('Authentication error. Please login again.');
          navigate('/login', { state: { from: '/orders' } });
        } else if (err.response.status === 500) {
          setError(`Server error: ${err.response.data.details || 'Internal server error'}`);
        } else {
          setError(`Error: ${err.response.data.error || 'Failed to load orders'}`);
        }
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError('Could not connect to the server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.id) {
      console.log('No user found, redirecting to login');
      setError('Please login to view your orders');
      setLoading(false);
      return;
    }

    // Check if token exists
    const token = getToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      setError('Please login to view your orders');
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    fetchOrders();
  }, [user, authLoading, retryCount, navigate]);

  const handleGoToProducts = () => {
    navigate('/products');
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Please login to view your orders.
        </Alert>
        <Link to="/login" className="me-2">
          <Button variant="primary">Go to Login</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Orders</h2>
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading your orders...</p>
        </div>
      ) : error ? (
        <div>
          <Alert variant="danger">{error}</Alert>
          <div className="d-flex justify-content-center mt-3">
            <Button variant="primary" onClick={handleRetry} className="me-2">
              Try Again
            </Button>
            <Button variant="outline-primary" onClick={handleGoToProducts}>
              Browse Products
            </Button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div>
          <Alert variant="info">
            You don't have any orders yet.
          </Alert>
          <div className="text-center mt-3">
            <Button variant="primary" onClick={handleGoToProducts}>
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Row>
            {orders.map(order => (
              <Col md={12} key={order.id} className="mb-4">
                <Card className="shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                    <div>
                      <strong>Order #{order.id}</strong>
                      <span className="ms-3 text-muted">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge bg={getStatusBadgeClass(order.status)}>
                      {order.status || 'Processing'}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <h6 className="mb-3">Order Items</h6>
                        {order.items && order.items.length > 0 ? (
                          order.items.map(item => (
                            <div key={item.id} className="d-flex justify-content-between mb-2 border-bottom pb-2">
                              <div>
                                <span className="fw-medium">{item.product_name || 'Product'}</span>
                                <span className="text-muted ms-2">× {item.quantity}</span>
                              </div>
                              <span>${((item.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">No items found for this order.</p>
                        )}
                      </Col>
                      <Col md={4}>
                        <div className="text-end">
                          <h6 className="mb-3">Order Summary</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Total Amount:</span>
                            <span className="fw-bold">${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                          </div>
                          <div className="mt-4">
                            <h6 className="mb-2">Shipping Address:</h6>
                            <p className="text-muted mb-0">{order.delivery_address || 'Not specified'}</p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div className="mt-4 text-center">
            <Button variant="primary" onClick={handleGoToProducts}>
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

// Helper function to get appropriate badge class based on status
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'processing':
      return 'warning';
    case 'in-transit':
      return 'info';
    case 'delivered':
      return 'success';
    default:
      return 'secondary';
  }
};

export default Orders; 