import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';

const SalesRefundPanel = () => {
  const { user } = useAuth();
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAction, setRefundAction] = useState('');

  useEffect(() => {
  
    if (user && user.role === 'sales_manager') {
      fetchRefundRequests();
    }
  }, [user]);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const ordersResponse = await axios.get('/orders?status=refund-requested');
      const ordersWithRefunds = ordersResponse.data;

      const refunds = await Promise.all(ordersWithRefunds.map(async (order) => {
        try {
          const refundResponse = await axios.get(`/refunds/order/${order.id}`);
          return { ...order, refund_id: refundResponse.data.id, refund_details: refundResponse.data };
        } catch {
          return order;
        }
      }));

      setRefundRequests(refunds);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = (order, action) => {
    setCurrentOrder(order);
    setRefundAction(action);
    setAdminNote('');
    setShowModal(true);
  };

  const handleSubmitRefund = async () => {
    try {
      const endpoint = refundAction === 'approve' 
        ? `/refunds/approve/${currentOrder.refund_id}` 
        : `/refunds/reject/${currentOrder.refund_id}`;
      
      await axios.patch(endpoint, { adminNote });
      setSuccess(`Refund ${refundAction}d successfully`);
      fetchRefundRequests();
    } catch (err) {
      console.error(err);
      setError('Failed to process refund');
    } finally {
      setShowModal(false);
    }
  };

  if (!user || user.role !== 'sales_manager') {
    return (
      <Container className="py-5">
        <Alert variant="danger">You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Refund Management</h2>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Card>
          <Card.Body>
            <Table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.user_name || `User #${req.user_id}`}</td>
                    <td>${parseFloat(req.total_amount || 0).toFixed(2)}</td>
                    <td>{req.refund_reason || 'N/A'}</td>
                    <td>
                      <Button size="sm" variant="success" onClick={() => handleProcessRefund(req, 'approve')}>
                        Approve
                      </Button>{' '}
                      <Button size="sm" variant="danger" onClick={() => handleProcessRefund(req, 'reject')}>
                        Deny
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{refundAction === 'approve' ? 'Approve' : 'Deny'} Refund</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Admin Note</Form.Label>
            <Form.Control
              as="textarea"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Enter admin note"
              required={refundAction === 'reject'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button 
            variant={refundAction === 'approve' ? 'success' : 'danger'}
            onClick={handleSubmitRefund}
          >
            {refundAction === 'approve' ? 'Approve' : 'Deny'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SalesRefundPanel;
