import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const ProductApproval = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (user && user.role === 'sales_manager') {
      fetchUnapprovedProducts();
    }
  }, [user]);

  const fetchUnapprovedProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/unapproved`);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch unapproved products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/products/${selectedProduct.id}/approve`, {
        price: parseFloat(price)
      });
      setShowModal(false);
      fetchUnapprovedProducts();
    } catch (err) {
      setError('Failed to approve product');
      console.error(err);
    }
  };

  if (!user || user.role !== 'sales_manager') {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Product Price Approval</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <Alert variant="info">No products waiting for approval.</Alert>
      ) : (
        <Table responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Current Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>{product.category}</td>
                <td>${product.price}</td>
                <td>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedProduct(product);
                      setPrice(product.price);
                      setShowModal(true);
                    }}
                  >
                    Set Price
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Product Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                value={selectedProduct?.name}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApprove}>
            Approve Price
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductApproval; 