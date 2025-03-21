import React from 'react';
import { Container, ListGroup, Button, Badge } from 'react-bootstrap';
import { BsTrash, BsDash, BsPlus } from 'react-icons/bs';

const ShoppingCart = ({ cartItems, setCartItems, onCheckout }) => {
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Container className="my-4">
      <h3>Shopping Cart</h3>
      {cartItems.length === 0 ? (
        <div className="text-center my-5">
          <h5 className="text-muted">Your cart is empty</h5>
        </div>
      ) : (
        <>
          <ListGroup className="mb-3">
            {cartItems.map(item => (
              <ListGroup.Item
                key={item.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <h6 className="mb-0">{item.name}</h6>
                  <small className="text-muted">${item.price}</small>
                </div>
                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <BsDash />
                  </Button>
                  <span className="mx-2">{item.quantity}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <BsPlus />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ms-2"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <BsTrash />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Total: <Badge bg="success">${total.toFixed(2)}</Badge></h5>
            <Button variant="primary" onClick={onCheckout}>Proceed to Checkout</Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default ShoppingCart; 