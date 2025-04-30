const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

// Get all products
router.get("/", (req, res) => {
  const { sort } = req.query;
  
  console.log('Sorting parameter received:', sort);
  
  let query;
  
  if (sort === 'popularity') {
    // Use RAND() for demonstration purposes to simulate popularity sorting
    query = "SELECT * FROM products WHERE visible = 1 ORDER BY RAND()";
    console.log('Applying random sorting to simulate popularity');
  } else {
    query = "SELECT * FROM products WHERE visible = 1";
  }
  
  console.log('Final query:', query);
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving products." });
    }
    console.log(`Returned ${results.length} products`);
    res.json(results);
  });
});

// Get all categories
router.get("/categories/all", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving categories." });
    }
    res.json(results);
  });
});

// Get products by category
router.get("/category/:categoryId", (req, res) => {
  const categoryId = req.params.categoryId;
  const { sort } = req.query;
  
  let query;
  
  if (sort === 'popularity') {
    // Use RAND() for demonstration purposes to simulate popularity sorting
    query = "SELECT * FROM products WHERE category_id = ? AND visible = 1 ORDER BY RAND()";
  } else {
    query = "SELECT * FROM products WHERE category_id = ? AND visible = 1";
  }
  
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error('Query error for category products:', err);
      return res.status(500).json({ error: "Error retrieving products by category." });
    }
    res.json(results);
  });
});

// Search products
router.get("/search/:query", (req, res) => {
  const searchQuery = `%${req.params.query}%`;
  const { sort } = req.query;
  
  let query;
  
  if (sort === 'popularity') {
    // Use RAND() for demonstration purposes to simulate popularity sorting
    query = "SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR model LIKE ?) AND visible = 1 ORDER BY RAND()";
  } else {
    query = "SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR model LIKE ?) AND visible = 1";
  }
  
  db.query(
    query,
    [searchQuery, searchQuery, searchQuery],
    (err, results) => {
      if (err) {
        console.error('Query error for search:', err);
        return res.status(500).json({ error: "Error searching products." });
      }
      res.json(results);
    }
  );
});

// Get latest products
router.get("/latest/:limit", (req, res) => {
  const limit = parseInt(req.params.limit) || 4;
  const query = "SELECT * FROM products WHERE visible = 1 ORDER BY id DESC LIMIT ?";
  
  console.log(`Fetching latest ${limit} products`);
  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving latest products." });
    }
    console.log(`Returned ${results.length} latest products`);
    res.json(results);
  });
});

// Get products with most recent ratings
router.get("/most-recently-rated/:limit", (req, res) => {
  const limit = parseInt(req.params.limit) || 4;
  
  // Query to get products with most recent ratings
  const query = `
    SELECT p.*, MAX(r.created_at) as latest_rating_date 
    FROM products p
    JOIN ratings r ON p.id = r.product_id
    WHERE p.visible = 1 AND r.comment_approved = 1
    GROUP BY p.id
    ORDER BY latest_rating_date DESC
    LIMIT ?
  `;
  
  console.log(`Fetching ${limit} most recently rated products`);
  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving recently rated products." });
    }
    console.log(`Returned ${results.length} recently rated products`);
    res.json(results);
  });
});

// Admin Routes for Product Management

// Get all products for admin (including invisible products)
router.get("/admin/all", verifyToken, (req, res) => {
  // Check if user has product_manager role
  if (req.user.role !== 'product_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product managers can access this endpoint." });
  }

  const query = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving products." });
    }
    res.json(results);
  });
});

// Add new product
router.post("/admin/create", verifyToken, (req, res) => {
  console.log("Creating product - received data:", JSON.stringify(req.body));
  
  // Check if user has product_manager role
  if (req.user.role !== 'product_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product managers can access this endpoint." });
  }
  
  // Extract fields with validation
  try {
    const { 
      name, 
      model = "", 
      serial_number = "", 
      description = "", 
      stock = 0,
      price, 
      warranty_months = 0, 
      distributor_info = "", 
      category_id 
    } = req.body;
    
    // Handle price specially - convert empty string or 0 to NULL for MySQL
    const priceValue = (price === '' || price === 0 || price === '0' || price === undefined) ? null : price;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Product name is required." });
    }
    
    if (!category_id) {
      return res.status(400).json({ error: "Category is required." });
    }
    
    // Always set new products to invisible (0)
    const visibilityValue = 0;
    
    const query = `
      INSERT INTO products 
      (name, model, serial_number, description, stock, price, warranty_months, distributor_info, category_id, visible) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    console.log("Executing query with params:", [name, model, serial_number, description, stock, priceValue, warranty_months, distributor_info, category_id, visibilityValue]);
    
    db.query(
      query,
      [name, model, serial_number, description, stock, priceValue, warranty_months, distributor_info, category_id, visibilityValue],
      (err, results) => {
        if (err) {
          console.error('Insert error details:', err);
          return res.status(500).json({ error: `Error creating product: ${err.message}` });
        }
        console.log("Product created successfully, ID:", results.insertId);
        res.status(201).json({ id: results.insertId, message: "Product created successfully" });
      }
    );
  } catch (error) {
    console.error("Exception in product creation:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Update product
router.put("/admin/:id", verifyToken, (req, res) => {
  console.log("Updating product - received data:", JSON.stringify(req.body));
  
  // Check if user has proper role
  if (req.user.role !== 'product_manager' && req.user.role !== 'sales_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product or sales managers can access this endpoint." });
  }
  
  const productId = req.params.id;
  const { name, model, serial_number, description, stock, price, warranty_months, distributor_info, category_id, visible } = req.body;
  
  // Handle price specially - convert empty string or 0 to NULL
  const priceValue = (price === '' || price === 0 || price === '0' || price === undefined) ? null : price;
  
  // Different logic based on user role
  let updateFields = {};
  let queryParams = [];
  let query = '';
  
  if (req.user.role === 'product_manager') {
    // Product managers can update everything except price and visibility is controlled by rules
    query = `
      UPDATE products 
      SET name = ?, model = ?, serial_number = ?, description = ?, stock = ?, 
          warranty_months = ?, distributor_info = ?, category_id = ?
      WHERE id = ?
    `;
    queryParams = [
      name, model, serial_number, description, stock, 
      warranty_months, distributor_info, category_id, productId
    ];
  } else if (req.user.role === 'sales_manager') {
    // Sales managers can update price and visibility
    query = `
      UPDATE products 
      SET price = ?, visible = ?
      WHERE id = ?
    `;
    queryParams = [priceValue, visible, productId];
  }
  
  console.log("Executing update query with params:", queryParams);
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: `Error updating product: ${err.message}` });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    
    res.json({ message: "Product updated successfully" });
  });
});

// Delete product
router.delete("/admin/:id", verifyToken, (req, res) => {
  // Check if user has product_manager role
  if (req.user.role !== 'product_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product managers can access this endpoint." });
  }
  
  const productId = req.params.id;
  
  // First check if there are any orders containing this product
  db.query(
    "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
    [productId],
    (err, results) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: "Error checking product references." });
      }
      
      if (results[0].count > 0) {
        return res.status(400).json({ 
          error: "Cannot delete product as it is referenced in orders. Consider setting visibility to false instead."
        });
      }
      
      // If no orders reference the product, proceed with deletion
      db.query(
        "DELETE FROM products WHERE id = ?",
        [productId],
        (err, results) => {
          if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ error: "Error deleting product." });
          }
          
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Product not found." });
          }
          
          res.json({ message: "Product deleted successfully" });
        }
      );
    }
  );
});

// Update product stock
router.patch("/admin/:id/stock", verifyToken, (req, res) => {
  // Check if user has product_manager role
  if (req.user.role !== 'product_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product managers can access this endpoint." });
  }
  
  const productId = req.params.id;
  const { stock } = req.body;
  
  if (stock === undefined) {
    return res.status(400).json({ error: "Stock value is required." });
  }
  
  db.query(
    "UPDATE products SET stock = ? WHERE id = ?",
    [stock, productId],
    (err, results) => {
      if (err) {
        console.error('Update stock error:', err);
        return res.status(500).json({ error: "Error updating product stock." });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found." });
      }
      
      res.json({ message: "Product stock updated successfully" });
    }
  );
});

// Update product visibility (accessible to both product_manager and sales_manager)
router.patch("/admin/:id/visibility", verifyToken, (req, res) => {
  // Check if user has proper role
  if (req.user.role !== 'product_manager' && req.user.role !== 'sales_manager') {
    return res.status(403).json({ error: "Unauthorized. Only product or sales managers can update visibility." });
  }
  
  const productId = req.params.id;
  const { visible } = req.body;
  
  if (visible === undefined) {
    return res.status(400).json({ error: "Visibility value is required." });
  }
  
  // If the user is product_manager and trying to make a product visible,
  // check if the product has a price set
  if (req.user.role === 'product_manager' && visible === 1) {
    db.query("SELECT price FROM products WHERE id = ?", [productId], (err, results) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: "Error checking product price." });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Product not found." });
      }
      
      const product = results[0];
      
      // Check if the product has a valid price
      if (!product.price || parseFloat(product.price) === 0) {
        return res.status(400).json({ 
          error: "Products need to have a price set by a Sales Manager before they can be made visible to customers." 
        });
      }
      
      // Price is set, so product can be made visible
      updateVisibility(productId, visible, res);
    });
  } else {
    // Product manager hiding a product, or sales manager changing visibility
    updateVisibility(productId, visible, res);
  }
});

// Helper function to update visibility
function updateVisibility(productId, visible, res) {
  db.query(
    "UPDATE products SET visible = ? WHERE id = ?",
    [visible, productId],
    (err, results) => {
      if (err) {
        console.error('Update visibility error:', err);
        return res.status(500).json({ error: "Error updating product visibility." });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found." });
      }
      
      res.json({ message: "Product visibility updated successfully" });
    }
  );
}

// Get product by ID - this generic route should be last
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  db.query("SELECT * FROM products WHERE id = ? AND visible = 1", [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving product." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json(results[0]);
  });
});

module.exports = router;
