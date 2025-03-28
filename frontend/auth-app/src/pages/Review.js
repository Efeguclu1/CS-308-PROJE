import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Review = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Debug için loglar
    console.log('Auth Loading:', authLoading);
    console.log('User Object:', user);
    console.log('LocalStorage userData:', localStorage.getItem('userData'));
    console.log('LocalStorage token:', localStorage.getItem('token'));

    // Auth yüklenene kadar bekle
    if (authLoading) return;

    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!user || !user.id) {
      console.log('User not found, redirecting to login');
      navigate('/login', { state: { from: '/checkout/review' } });
      return;
    }

    // Get payment info from sessionStorage
    const storedPaymentInfo = sessionStorage.getItem('paymentInfo');
    if (storedPaymentInfo) {
      setPaymentInfo(JSON.parse(storedPaymentInfo));
    }
  }, [user, authLoading, navigate]);

  const handlePlaceOrder = async () => {
    // Debug için loglar
    console.log('Placing order with user:', user);
    console.log('Cart items:', cartItems);

    // Auth yüklenene kadar bekle
    if (authLoading) {
      console.log('Auth still loading...');
      return;
    }

    // Kullanıcı kontrolü
    if (!user || !user.id) {
      console.log('No user found when placing order');
      setError('Please login to place an order');
      navigate('/login', { state: { from: '/checkout/review' } });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storedPaymentInfo = JSON.parse(sessionStorage.getItem('paymentInfo'));
      if (!storedPaymentInfo) {
        throw new Error('Payment information not found');
      }

      // Kart numarasından boşlukları temizle
      const cleanCardNumber = storedPaymentInfo.cardNumber.replace(/\s/g, '');

      const orderData = {
        cardNumber: cleanCardNumber,
        cardName: storedPaymentInfo.cardName,
        expirationMonth: storedPaymentInfo.expirationMonth,
        expirationYear: storedPaymentInfo.expirationYear,
        cvv: storedPaymentInfo.cvv,
        userId: user.id,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getCartTotal()
      };

      console.log('Sending order data:', { 
        ...orderData, 
        cardNumber: '****' + cleanCardNumber.slice(-4)
      });

      const response = await axios.post('http://localhost:5001/api/payment/process', orderData);

      console.log('Order response:', response.data);

      if (response.data.success) {
        clearCart();
        sessionStorage.removeItem('paymentInfo');
        navigate('/order-success', { 
          state: { 
            orderId: response.data.orderId 
          }
        });
      } else {
        throw new Error(response.data.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order Error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.error || 'Failed to place order. Please try again.');
      } else {
        console.error('Error details:', err);
        setError(err.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!paymentInfo) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Payment information not found. Please complete the payment step first.
        </Alert>
        <Button onClick={() => navigate('/checkout/payment')}>
          Go to Payment
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Review Your Order</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <h4>Payment Details</h4>
              <p>Card ending in: **** **** **** {paymentInfo.cardNumber}</p>
              <p>Name on card: {paymentInfo.cardName}</p>
              <p>Expires: {paymentInfo.expirationMonth}/{paymentInfo.expirationYear}</p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <h4>Order Items</h4>
              {cartItems.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2">
                  <div>
                    {item.name} x {item.quantity}
                  </div>
                  <div>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body>
              <h4>Order Summary</h4>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>Calculated at checkout</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>${getCartTotal().toFixed(2)}</strong>
              </div>
              <Button
                variant="primary"
                className="w-100"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Review; 