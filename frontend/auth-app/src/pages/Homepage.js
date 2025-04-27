import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Carousel } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import './Homepage.scss';
import { API_BASE_URL } from '../config';

const Homepage = () => {
  const [randomProducts, setRandomProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products`);
        const products = response.data;
        // Rastgele 4 ürün seç
        const shuffled = products.sort(() => 0.5 - Math.random());
        setRandomProducts(shuffled.slice(0, 4));
      } catch (err) {
        setRandomProducts([]);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="homepage">
      {/* Hero Banner */}
      <section className="hero-section">
        <Container>
          <Carousel className="hero-carousel">
            <Carousel.Item>
              <div className="carousel-image slide1"></div>
              <Carousel.Caption>
                <h2>New iPhone 15 Pro</h2>
                <p>Discover the newest iPhone models</p>
                <Link to="/products?category=2">
                  <Button variant="primary">Buy Now</Button>
                </Link>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <div className="carousel-image slide2"></div>
              <Carousel.Caption>
                <h2>Upgrade Your Gaming Experience</h2>
                <p>Improve your performance with the latest gaming equipment</p>
                <Link to="/products?category=5">
                  <Button variant="primary">Explore</Button>
                </Link>
              </Carousel.Caption>
            </Carousel.Item>
          </Carousel>
        </Container>
      </section>

      {/* Top Deals Section */}
      <section className="deals-section">
        <Container>
          <div className="section-header">
            <h2>Today's Deals</h2>
            <Link to="/products" className="view-all">View All</Link>
          </div>
          <Row>
            {randomProducts.map((product) => (
              <Col lg={3} md={6} className="mb-4" key={product.id}>
                <Card className="product-card" style={{cursor: 'pointer'}} onClick={() => navigate(`/products/${product.id}`)}>
                  <div className="product-badge">SALE</div>
                  <div className="product-image" style={{
                    backgroundImage: (() => {
                      let imageUrl = '';
                      switch (product.name) {
                        case "iPhone 15 Pro":
                          imageUrl = "https://images.unsplash.com/photo-1710023038502-ba80a70a9f53?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "MacBook Pro M2":
                          imageUrl = "https://images.unsplash.com/photo-1675868374786-3edd36dddf04?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Samsung QLED TV":
                          imageUrl = "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Sony WH-1000XM4":
                        case "Sony WH-1000XM4 Kulaklık":
                          imageUrl = "https://images.unsplash.com/photo-1614860243518-c12eb2fdf66c?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "PlayStation 5":
                          imageUrl = "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Dell XPS 13":
                          imageUrl = "https://images.unsplash.com/photo-1720556405438-d67f0f9ecd44?q=80&w=2030&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Samsung Galaxy S23":
                          imageUrl = "https://images.unsplash.com/photo-1675452937281-24485562bd84?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "LG OLED TV":
                          imageUrl = "https://images.unsplash.com/photo-1717295248230-93ea71f48f92?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Apple AirPods Pro":
                          imageUrl = "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Xbox Series X":
                          imageUrl = "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Apple Watch Series 8":
                          imageUrl = "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        case "Samsung Galaxy Watch 6":
                          imageUrl = "https://images.unsplash.com/photo-1553545204-4f7d339aa06a?q=80&w=1093&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                          break;
                        default:
                          imageUrl = product.image_url || '';
                      }
                      return `url(${imageUrl})`;
                    })(),
                  }}></div>
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <div className="price-container">
                      <span className="current-price">${parseFloat(product.price).toLocaleString()}</span>
                      <span className="old-price">{product.old_price ? `$${parseFloat(product.old_price).toLocaleString()}` : ''}</span>
                    </div>
                    <div className="product-rating">
                      <span className="stars">
                        {Array.from({length: 5}).map((_, i) => (
                          <span key={i} className={i < Math.round(product.average_rating || 0) ? '' : 'gray-star'}>★</span>
                        ))}
                      </span>
                      <span className="rating-count">({product.rating_count || 0})</span>
                    </div>
                    <Button variant="primary" className="mt-2 w-100" onClick={e => {e.stopPropagation(); /* sepete ekleme işlemi */}}>Add to Cart</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <Container>
          <div className="section-header">
            <h2>Popular Categories</h2>
          </div>
          <Row>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=1" className="category-card">
                <div className="category-image laptops"></div>
                <p>Laptops</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=2" className="category-card">
                <div className="category-image phones"></div>
                <p>Phones</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=3" className="category-card">
                <div className="category-image tvs"></div>
                <p>Televisions</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=5" className="category-card">
                <div className="category-image gaming"></div>
                <p>Gaming</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=4" className="category-card">
                <div className="category-image audio"></div>
                <p>Audio</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products?category=7" className="category-card">
                <div className="category-image wearables"></div>
                <p>Wearables</p>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Homepage;
