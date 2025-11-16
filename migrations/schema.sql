-- GoldShop MySQL schema
CREATE DATABASE IF NOT EXISTS goldshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE goldshop;

DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS points_history;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS gold_price;

CREATE TABLE gold_price (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  karat VARCHAR(10) NOT NULL,
  buy_price DECIMAL(12,4) NOT NULL,
  sell_price DECIMAL(12,4) NOT NULL,
  source VARCHAR(100) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  phone VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  points INT DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'regular',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE points_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  member_id BIGINT NOT NULL,
  change_amount INT NOT NULL,
  balance_after INT NOT NULL,
  reason VARCHAR(255),
  related_sale_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_points_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  weight_gram DECIMAL(10,3) NOT NULL,
  workmanship_fee DECIMAL(10,2) DEFAULT 0,
  karat VARCHAR(10) DEFAULT '999',
  stock INT DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sales (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(100) UNIQUE,
  member_id BIGINT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  points_earned INT DEFAULT 0,
  processed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sale_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sale_id BIGINT NOT NULL,
  product_id BIGINT NULL,
  description VARCHAR(255),
  weight_gram DECIMAL(10,3),
  price_each DECIMAL(12,2),
  quantity INT DEFAULT 1,
  CONSTRAINT fk_saleitems_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_saleitems_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed sample data
INSERT INTO gold_price (karat, buy_price, sell_price, source) VALUES
 ('999', 295.00, 305.00, 'manual'),
 ('916', 270.00, 280.00, 'manual'),
 ('750', 220.00, 230.00, 'manual');

INSERT INTO members (name, phone, email, points) VALUES
 ('Test Member', '0100000000', 'test@example.com', 10);
