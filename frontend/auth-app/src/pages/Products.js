import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Card, Row, Col, Form, Button, Dropdown, Nav } from "react-bootstrap";
import './Products.scss';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  
  // Sample product data for demonstration
  const sampleProducts = [
    { id: 1, name: "Apple iPhone 15 Pro 256GB", price: 42999, category: "phones", color: ["black", "blue", "white"], image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=1480&auto=format&fit=crop" },
    { id: 2, name: "Samsung Galaxy S24 Ultra", price: 36999, category: "phones", color: ["black", "green"], image: "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?q=80&w=1471&auto=format&fit=crop" },
    { id: 3, name: "MacBook Pro 14\" M3 Chip", price: 52999, category: "computers", color: ["gray", "silver"], image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1420&auto=format&fit=crop" },
    { id: 4, name: "Sony WH-1000XM5 Kulaklık", price: 9999, category: "audio", color: ["black", "white"], image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1465&auto=format&fit=crop" },
    { id: 5, name: "Samsung 65\" OLED 4K Smart TV", price: 48999, category: "tv", color: ["black"], image: "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?q=80&w=1470&auto=format&fit=crop" },
    { id: 6, name: "PlayStation 5 Slim Konsol", price: 24999, category: "gaming", color: ["white"], image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=1527&auto=format&fit=crop" },
  ];

  useEffect(() => {
    // Try to fetch from API
    axios.get("http://localhost:5000/api/products")
      .then((response) => {
        if (response.data && response.data.length > 0) {
          setProducts(response.data);
        } else {
          // If no products from API, use sample data
          setProducts(sampleProducts);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ürünleri yüklerken hata oluştu:", error);
        // Fallback to sample data
        setProducts(sampleProducts);
        setLoading(false);
      });
  }, []);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // Default sorting (featured)
  });

  return (
    <div className="products-page">
      {/* Category Banner */}
      <div className="category-banner">
        <h1>Teknoloji Ürünleri</h1>
        <p>En yeni ve en kaliteli elektronik ürünler</p>
      </div>
      
      <Container className="my-5">
        <Row>
          {/* Filters Sidebar */}
          <Col lg={3} className="filters-sidebar mb-4">
            <h4>Kategoriler</h4>
            <Nav className="flex-column category-nav">
              <Nav.Link 
                className={activeCategory === 'all' ? 'active' : ''} 
                onClick={() => handleCategoryChange('all')}
              >
                Tüm Ürünler
              </Nav.Link>
              <Nav.Link 
                className={activeCategory === 'computers' ? 'active' : ''} 
                onClick={() => handleCategoryChange('computers')}
              >
                Bilgisayarlar
              </Nav.Link>
              <Nav.Link 
                className={activeCategory === 'phones' ? 'active' : ''} 
                onClick={() => handleCategoryChange('phones')}
              >
                Telefonlar
              </Nav.Link>
              <Nav.Link 
                className={activeCategory === 'tv' ? 'active' : ''} 
                onClick={() => handleCategoryChange('tv')}
              >
                Televizyonlar
              </Nav.Link>
              <Nav.Link 
                className={activeCategory === 'audio' ? 'active' : ''} 
                onClick={() => handleCategoryChange('audio')}
              >
                Ses Sistemleri
              </Nav.Link>
              <Nav.Link 
                className={activeCategory === 'gaming' ? 'active' : ''} 
                onClick={() => handleCategoryChange('gaming')}
              >
                Gaming
              </Nav.Link>
            </Nav>
            
            <hr />
            
            <h4>Filtreler</h4>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Renk</Form.Label>
                <div className="color-options">
                  <div className="color-option bg-dark"></div>
                  <div className="color-option bg-primary"></div>
                  <div className="color-option bg-light border"></div>
                  <div className="color-option bg-success"></div>
                  <div className="color-option bg-secondary"></div>
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Fiyat Aralığı</Form.Label>
                <Form.Range />
                <div className="d-flex justify-content-between">
                  <span>0 ₺</span>
                  <span>50.000+ ₺</span>
                </div>
              </Form.Group>
              
              <Button variant="outline-dark" className="w-100">Filtreleri Uygula</Button>
            </Form>
          </Col>
          
          {/* Products Grid */}
          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="m-0">{sortedProducts.length} ürün bulundu</h5>
              </div>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                  {sortBy === 'featured' && 'Öne Çıkanlar'}
                  {sortBy === 'price-low' && 'Fiyata Göre (Artan)'}
                  {sortBy === 'price-high' && 'Fiyata Göre (Azalan)'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleSortChange('featured')}>Öne Çıkanlar</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSortChange('price-low')}>Fiyata Göre (Artan)</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSortChange('price-high')}>Fiyata Göre (Azalan)</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            
            {loading ? (
              <p className="text-center">Ürünler yükleniyor...</p>
            ) : sortedProducts.length === 0 ? (
              <p className="text-center">Ürün bulunamadı.</p>
            ) : (
              <Row>
                {sortedProducts.map((product) => (
                  <Col key={product.id} lg={4} md={6} className="mb-4">
                    <Card className="product-card">
                      <div 
                        className="product-image" 
                        style={{ backgroundImage: `url(${product.image})` }}
                      ></div>
                      <Card.Body>
                        <Card.Title>{product.name}</Card.Title>
                        <Card.Text className="product-price">{product.price.toLocaleString()} ₺</Card.Text>
                        <div className="product-colors">
                          {product.color && product.color.map((clr, index) => (
                            <span 
                              key={index} 
                              className={`color-dot bg-${clr === 'black' ? 'dark' : 
                                          clr === 'blue' ? 'primary' : 
                                          clr === 'green' ? 'success' : 
                                          clr === 'white' ? 'light border' :
                                          clr === 'gray' ? 'secondary' : 'secondary'}`}
                            ></span>
                          ))}
                        </div>
                        <Button variant="primary" className="mt-2 w-100">Sepete Ekle</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Products;
