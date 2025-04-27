import { Container, Row, Col, Card, Button, Carousel } from "react-bootstrap";
import { Link } from "react-router-dom";
import './Homepage.scss';

const Homepage = () => {
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
            <Link to="/products/deals" className="view-all">View All</Link>
          </div>
          <Row>
            {[1, 2, 3, 4].map((item) => (
              <Col lg={3} md={6} className="mb-4" key={item}>
                <Card className="product-card">
                  <div className="product-badge">SALE</div>
                  <div className="product-image product-{item}"></div>
                  <Card.Body>
                    <Card.Title>Tech Product {item}</Card.Title>
                    <div className="price-container">
                      <span className="current-price">${(1299 - item * 100).toLocaleString()}</span>
                      <span className="old-price">$1,299</span>
                    </div>
                    <div className="product-rating">
                      <span className="stars">★★★★<span className="gray-star">★</span></span>
                      <span className="rating-count">(42)</span>
                    </div>
                    <Button variant="primary" className="mt-2 w-100">Add to Cart</Button>
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
              <Link to="/products/computers" className="category-card">
                <div className="category-image laptops"></div>
                <p>Laptops</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products/phones" className="category-card">
                <div className="category-image phones"></div>
                <p>Phones</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products/tv" className="category-card">
                <div className="category-image tvs"></div>
                <p>Televisions</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products/gaming" className="category-card">
                <div className="category-image gaming"></div>
                <p>Gaming</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products/audio" className="category-card">
                <div className="category-image audio"></div>
                <p>Audio</p>
              </Link>
            </Col>
            <Col xs={6} md={4} lg={2} className="mb-4">
              <Link to="/products/wearables" className="category-card">
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
