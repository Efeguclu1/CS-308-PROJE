import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `http://localhost:5000/api/auth/profile/${user.id}`,
        { name, email },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      login({ ...response.data, token: user.token });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `http://localhost:5000/api/auth/change-password/${user.id}`,
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Please login to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Profile</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h4 className="mb-0">Profile Information</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleUpdateProfile}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Change Password</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 