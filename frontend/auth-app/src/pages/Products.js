import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Card, Row, Col } from "react-bootstrap";

const Products = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then((response) => {
        console.log("Ürünler:", response.data); // ✅ Konsolda kontrol edelim
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Ürünleri yüklerken hata oluştu:", error);
      });
  }, []);

  return (
    <Container>
      <h1 className="text-center my-4">Ürünler</h1>
      <Row>
        {products.length === 0 ? (
          <p className="text-center">Ürün bulunamadı.</p>
        ) : (
          products.map((product) => (
            <Col key={product.id} md={4}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text>{product.description}</Card.Text>
                  <Card.Text><strong>Fiyat:</strong> {product.price} TL</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default Products;
