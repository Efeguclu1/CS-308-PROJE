import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Row, Col, Form } from 'react-bootstrap';
import { FaStar, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './ReviewApproval.scss';

const ReviewApproval = () => {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is a product manager
  useEffect(() => {
    if (user && user.role !== 'product_manager') {
      setError('You do not have permission to access this page');
    }
  }, [user]);

  // Fetch products for the dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products');
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, []);

  // Fetch pending reviews for selected product
  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!selectedProduct) {
        setPendingReviews([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/ratings/admin/product/${selectedProduct}`);
        // Filter for reviews with comments that are not approved
        const pending = response.data.filter(
          review => review.comment && review.comment_approved === 0
        );
        setPendingReviews(pending);
        setError('');
      } catch (err) {
        console.error('Error fetching pending reviews:', err);
        setError('Failed to load pending reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingReviews();
  }, [selectedProduct]);

  const handleApprove = async (reviewId) => {
    try {
      await axios.put(`http://localhost:5001/api/ratings/approve/${reviewId}`);
      
      // Update local state
      setPendingReviews(pendingReviews.filter(review => review.id !== reviewId));
      setSuccessMessage('Review approved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error approving review:', err);
      setError('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await axios.delete(`http://localhost:5001/api/ratings/${reviewId}`);
      
      // Update local state
      setPendingReviews(pendingReviews.filter(review => review.id !== reviewId));
      setSuccessMessage('Review rejected successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error rejecting review:', err);
      setError('Failed to reject review');
    }
  };

  // Helper to render stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FaStar 
        key={index} 
        className={index < Math.round(rating) ? 'star filled' : 'star'} 
      />
    ));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (user && user.role !== 'product_manager') {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          You do not have permission to access this page. Only product managers can approve reviews.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5 review-approval-container">
      <h2 className="mb-4">Review Approval</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col>
              <Form.Group>
                <Form.Label><strong>Select Product</strong></Form.Label>
                <Form.Select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Select a product --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading reviews...</span>
          </Spinner>
        </div>
      ) : pendingReviews.length === 0 ? (
        <Alert variant="info">
          {selectedProduct 
            ? 'No pending reviews to approve for this product' 
            : 'Please select a product to view pending reviews'}
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover className="review-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingReviews.map(review => (
                <tr key={review.id}>
                  <td>{review.user_name}</td>
                  <td>
                    <div className="rating">
                      {renderStars(review.rating)}
                      <Badge bg="primary" className="ms-2">
                        {review.rating.toFixed(1)}
                      </Badge>
                    </div>
                  </td>
                  <td className="review-comment">{review.comment}</td>
                  <td>{formatDate(review.created_at)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                      >
                        <FaCheck /> Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleReject(review.id)}
                      >
                        <FaTimes /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default ReviewApproval; 