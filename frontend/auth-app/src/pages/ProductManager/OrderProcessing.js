import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Card, Row, Col, Form, Modal, Nav, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './OrderProcessing.scss';

const OrderProcessing = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundLoading, setRefundLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [refundAction, setRefundAction] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Fetch all orders for admin
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);
      
      let url = `${API_BASE_URL}/orders`;
      if (statusFilter) {
        url = `${API_BASE_URL}/orders?status=${statusFilter}`;
      }
      
      console.log('Fetching orders from:', url);
      console.log('Current user role:', user?.role);
      const response = await axios.get(url);
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setAuthError(true);
          setError('You do not have permission to access this feature. Only product managers can access order processing.');
        } else {
          setError(`Failed to load orders: ${err.response.data?.error || 'Server error'}`);
        }
      } else {
        setError('Failed to load orders. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch refund requests
  const fetchRefundRequests = async () => {
    try {
      setRefundLoading(true);
      setError(null);
      
      console.log('Fetching refund requests');
      // First, get orders with refund-requested status
      const ordersResponse = await axios.get(`${API_BASE_URL}/orders?status=refund-requested`);
      console.log('Fetched refund-requested orders:', ordersResponse.data);
      
      // For each order, find the corresponding refund request
      const ordersWithRefunds = ordersResponse.data;
      const refundsWithDetails = [];
      
      if (ordersWithRefunds && ordersWithRefunds.length > 0) {
        const promises = ordersWithRefunds.map(async (order) => {
          try {
            // Get refund details for this order
            const refundResponse = await axios.get(`${API_BASE_URL}/refunds/order/${order.id}`);
            const refundData = refundResponse.data;
            
            // Combine order and refund data
            return {
              ...order,
              refund_id: refundData.id,
              refund_details: refundData
            };
          } catch (err) {
            console.error(`Error fetching refund for order ${order.id}:`, err);
            return order; // Return just the order if refund details can't be fetched
          }
        });
        
        const results = await Promise.all(promises);
        refundsWithDetails.push(...results);
      }
      
      console.log('Combined refund data:', refundsWithDetails);
      setRefundRequests(refundsWithDetails);
    } catch (err) {
      console.error('Error fetching refund requests:', err);
      
      if (err.response?.status === 403) {
        setAuthError(true);
      } else {
        setError(`Failed to load refund requests: ${err.response?.data?.error || 'Server error'}`);
      }
    } finally {
      setRefundLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is logged in
    if (user && user.id) {
      if (activeTab === 'orders') {
        fetchOrders();
      } else if (activeTab === 'refunds') {
        fetchRefundRequests();
      }
    }
  }, [statusFilter, user, activeTab]);

  // Handle status change
  const handleStatusChange = (order) => {
    setCurrentOrder(order);
    setSelectedStatus(order.status || 'processing');
    setShowModal(true);
  };

  // Update order status
  const handleUpdateStatus = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/orders/${currentOrder.id}/status`, {
        status: selectedStatus
      });
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === currentOrder.id 
          ? { ...order, status: selectedStatus } 
          : order
      ));
      
      setSuccess('Order status updated successfully');
      setShowModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating order status:', err);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to update order status. Only product managers can perform this action.');
      } else {
        setError(`Failed to update order status: ${err.response?.data?.error || 'Server error'}`);
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Refund işleme - onay veya red
  const handleProcessRefund = (order, action) => {
    console.log('Processing refund for order:', order);
    setCurrentOrder(order);
    setRefundAction(action);
    setAdminNote('');
    setShowRefundModal(true);
  };

  // Refund talebini onaylama veya reddetme
  const handleSubmitRefundAction = async () => {
    try {
      console.log('Processing refund action:', refundAction);
      console.log('Current order:', currentOrder);
      console.log('Admin note:', adminNote);
      
      // Get the refund ID from the current order object
      const refundId = currentOrder.refund_id || null;
      
      if (!refundId) {
        throw new Error('Refund ID not found. Cannot process the request.');
      }
      
      console.log('Using refund ID:', refundId);
      
      let response;
      if (refundAction === 'approve') {
        response = await axios.patch(`${API_BASE_URL}/refunds/approve/${refundId}`, {
          adminNote
        });
      } else {
        response = await axios.patch(`${API_BASE_URL}/refunds/reject/${refundId}`, {
          adminNote
        });
      }
      
      console.log('Refund process response:', response.data);
      
      // Update the refund request in the local state
      setRefundRequests(refundRequests.filter(req => req.id !== currentOrder.id));
      
      // Set success message
      setSuccess(`Refund request ${refundAction === 'approve' ? 'approved' : 'denied'} successfully`);
      setShowRefundModal(false);
      
      // Refresh the refund requests list
      fetchRefundRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error processing refund request:', err);
      
      let errorMessage = 'Failed to process refund request';
      if (err.response) {
        console.error('Error response:', err.response.data);
        errorMessage = err.response.data.error || errorMessage;
      }
      
      if (err.response?.status === 403) {
        setError('You do not have permission to process refund requests.');
      } else {
        setError(`Failed to process refund request: ${errorMessage}`);
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get appropriate badge color for status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processing':
        return 'primary';
      case 'in-transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'refund-requested':
        return 'warning';
      case 'refund-approved':
        return 'success';
      case 'refund-denied':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // If user doesn't have product_manager role
  if (user && user.role !== 'product_manager') {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          You don't have permission to access this page. This page is only for product managers.
        </Alert>
      </Container>
    );
  }

  // If no user or still loading authentication
  if (!user) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Checking authentication...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5 order-processing-page">
      <h2 className="mb-4">Order Management</h2>
      
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tab.Container activeKey={activeTab} onSelect={(key) => {
        setActiveTab(key);
        // When switching to refunds tab, fetch refund requests
        if (key === 'refunds') {
          fetchRefundRequests();
        } else if (key === 'orders') {
          fetchOrders();
        }
      }}>
        <Card className="mb-4">
          <Card.Header>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="orders">Order Processing</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="refunds">Refund Management</Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="orders">
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="statusFilter" className="mb-3">
                      <Form.Label>Filter by Status</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Orders</option>
                        <option value="processing">Processing</option>
                        <option value="in-transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => fetchOrders()}
                      disabled={loading || authError}
                      className="mb-2"
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Loading...
                        </>
                      ) : 'Refresh Orders'}
                    </Button>
                  </Col>
                </Row>
                
                {loading ? (
                  <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading orders...</span>
                    </Spinner>
                  </div>
                ) : authError ? (
                  <Alert variant="danger">
                    <h5>Authentication Error</h5>
                    <p>You do not have permission to access order management. This feature is restricted to product managers only.</p>
                    <p>Please contact your administrator if you believe you should have access.</p>
                  </Alert>
                ) : orders.length === 0 ? (
                  <Alert variant="info">
                    No orders found.
                  </Alert>
                ) : (
                  <Table responsive className="order-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Total Amount</th>
                        <th>Items</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.user_name || `User #${order.user_id}`}</td>
                          <td>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                          <td>{order.items?.length || 0} items</td>
                          <td>{formatDate(order.created_at)}</td>
                          <td>
                            <Badge bg={getStatusBadgeClass(order.status)}>
                              {order.status || 'Processing'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleStatusChange(order)}
                            >
                              Update Status
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>
              
              <Tab.Pane eventKey="refunds">
                <Row className="mb-3">
                  <Col>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => fetchRefundRequests()}
                      disabled={refundLoading}
                      className="mb-2"
                    >
                      {refundLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Loading...
                        </>
                      ) : 'Refresh Refund Requests'}
                    </Button>
                  </Col>
                </Row>
                
                {refundLoading ? (
                  <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading refund requests...</span>
                    </Spinner>
                  </div>
                ) : authError ? (
                  <Alert variant="danger">
                    <h5>Authentication Error</h5>
                    <p>You do not have permission to access refund management.</p>
                  </Alert>
                ) : refundRequests.length === 0 ? (
                  <Alert variant="info">
                    No refund requests pending.
                  </Alert>
                ) : (
                  <Table responsive className="refund-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Refund ID</th>
                        <th>User</th>
                        <th>Total Amount</th>
                        <th>Date</th>
                        <th>Refund Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundRequests.map(request => (
                        <tr key={request.id}>
                          <td>{request.id}</td>
                          <td>{request.refund_id || 'Unknown'}</td>
                          <td>{request.user_name || `User #${request.user_id}`}</td>
                          <td>${parseFloat(request.total_amount || 0).toFixed(2)}</td>
                          <td>{formatDate(request.created_at)}</td>
                          <td>
                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {request.refund_reason || 'No reason provided'}
                            </div>
                          </td>
                          <td>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="me-2"
                              onClick={() => handleProcessRefund(request, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleProcessRefund(request, 'deny')}
                            >
                              Deny
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      {/* Status Update Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentOrder && (
            <>
              <p><strong>Order ID:</strong> {currentOrder.id}</p>
              <p><strong>Current Status:</strong> {currentOrder.status || 'Processing'}</p>
              <Form.Group className="mb-3">
                <Form.Label>Select New Status</Form.Label>
                <Form.Select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="processing">Processing</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Refund Processing Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {refundAction === 'approve' ? 'Approve' : 'Deny'} Refund Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentOrder && (
            <>
              <p><strong>Order ID:</strong> {currentOrder.id}</p>
              <p><strong>User:</strong> {currentOrder.user_name || `User #${currentOrder.user_id}`}</p>
              <p><strong>Amount:</strong> ${parseFloat(currentOrder.total_amount || 0).toFixed(2)}</p>
              
              <div className="mb-3">
                <h6>Refund Reason:</h6>
                <p className="border p-2 bg-light">{currentOrder.refund_reason || 'No reason provided'}</p>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Admin Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={refundAction === 'approve' ? 'Optional note for the approved refund' : 'Please explain why you are denying this refund request'}
                  required={refundAction === 'deny'}
                />
                {refundAction === 'deny' && !adminNote && (
                  <Form.Text className="text-danger">
                    A reason is required when denying a refund request
                  </Form.Text>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={refundAction === 'approve' ? 'success' : 'danger'} 
            onClick={handleSubmitRefundAction}
            disabled={refundAction === 'deny' && !adminNote.trim()}
          >
            {refundAction === 'approve' ? 'Approve Refund' : 'Deny Refund'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderProcessing; 