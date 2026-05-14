-- ============================================================
-- ECommerceDB - Creation & Seed Script
-- Run this script against your MS SQL Server instance.
-- It creates the database, all tables, and seeds product data.
-- ============================================================

USE master;
GO

-- Drop and recreate the database for a clean install
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'ECommerceDB')
BEGIN
    ALTER DATABASE ECommerceDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ECommerceDB;
END
GO

CREATE DATABASE ECommerceDB;
GO

USE ECommerceDB;
GO

-- ============================================================
-- TABLE: Users
-- Stores registered user accounts. Passwords are stored as
-- BCrypt hashes — never plain text.
-- ============================================================
CREATE TABLE Users (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    FirstName   NVARCHAR(100)  NOT NULL,
    LastName    NVARCHAR(100)  NOT NULL,
    Email       NVARCHAR(255)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(512) NOT NULL,
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- TABLE: Products
-- The product catalog. Prices in USD stored as DECIMAL(10,2).
-- ============================================================
CREATE TABLE Products (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(200)  NOT NULL,
    Description NVARCHAR(1000) NOT NULL,
    Price       DECIMAL(10,2)  NOT NULL CHECK (Price >= 0),
    Category    NVARCHAR(100)  NOT NULL,
    ImageUrl    NVARCHAR(500)  NOT NULL,
    Stock       INT            NOT NULL DEFAULT 0 CHECK (Stock >= 0),
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- TABLE: CartItems
-- Persists cart state per user. One row per product-per-user.
-- ============================================================
CREATE TABLE CartItems (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    UserId      INT  NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    ProductId   INT  NOT NULL REFERENCES Products(Id) ON DELETE CASCADE,
    Quantity    INT  NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    CONSTRAINT UQ_Cart_UserProduct UNIQUE (UserId, ProductId)
);
GO

-- ============================================================
-- TABLE: Orders
-- One row per placed order. TotalPrice is ALWAYS computed
-- server-side — never trusted from the client.
-- ============================================================
CREATE TABLE Orders (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT            NOT NULL REFERENCES Users(Id),
    TotalPrice      DECIMAL(10,2)  NOT NULL,
    ShippingAddress NVARCHAR(500)  NOT NULL,
    Status          NVARCHAR(50)   NOT NULL DEFAULT 'Pending',
    CreatedAt       DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- TABLE: OrderItems
-- Line items for each order — snapshot of price at order time.
-- ============================================================
CREATE TABLE OrderItems (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    OrderId     INT            NOT NULL REFERENCES Orders(Id) ON DELETE CASCADE,
    ProductId   INT            NOT NULL REFERENCES Products(Id),
    Quantity    INT            NOT NULL,
    UnitPrice   DECIMAL(10,2)  NOT NULL  -- snapshot of price at order time
);
GO

-- ============================================================
-- SEED: Products (30 items across multiple categories)
-- Images sourced from automationexercise.com convention
-- ============================================================
INSERT INTO Products (Name, Description, Price, Category, ImageUrl, Stock) VALUES
-- Women''s Tops
('Blue Top',           'Stylish blue top perfect for casual wear. Lightweight and breathable fabric.', 500.00,  'Women''s Tops',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/b/l/blue-top.jpg',   120),
('Men Tshirt',         'Classic white crew-neck t-shirt. 100% cotton, machine washable.',              400.00,  'Men''s T-shirts',  'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/m/s/mss01d.jpg',      200),
('Sleeveless Dress',   'Elegant sleeveless dress. Perfect for summer events and casual outings.',      1000.00, 'Women''s Dress',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/k/skd1s.jpg',       80),
('Stylish Dress',      'Chic and modern dress with floral print. Suitable for all occasions.',         1500.00, 'Women''s Dress',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/e/d/ed1116.jpg',     60),
('Winter Top',         'Warm knitted winter top. Stay cozy while looking stylish.',                    600.00,  'Women''s Tops',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/w/t/wt1.jpg',        90),
('Summer White Top',   'Light and airy white top — a summer wardrobe essential.',                      400.00,  'Women''s Tops',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/u/summer-white-top.jpg', 150),

-- Men''s
('Soft Stretch Jeans', 'Comfortable stretch denim jeans. Classic fit, available in blue.',             799.00,  'Men''s Jeans',     'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/j/e/jeans1.jpg',      100),
('Cotton Mull Saree',  'Traditional cotton mull saree with elegant border design.',                    1299.00, 'Women''s Saree',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/c/o/cotton-mull-saree.jpg', 40),
('Lace Top',           'Delicate lace top with floral pattern. Perfect for evening wear.',             700.00,  'Women''s Tops',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/l/a/lace-top.jpg',     70),
('Fancy Green Top',    'Vibrant green top with decorative detailing. Eye-catching and unique.',        800.00,  'Women''s Tops',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/f/a/fancy-green-top.jpg', 55),

-- Kids
('Girl''s Kurti',       'Adorable kurti for girls. Comfortable cotton blend, vibrant print.',          899.00,  'Kids',             'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/k/u/kurti.jpg',       65),
('Boys Polo Shirt',    'Classic polo shirt for boys. Breathable and easy to wash.',                    599.00,  'Kids',             'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/p/o/polo.jpg',        85),
('Kids'' Frock',        'Colorful frock for little girls. Soft fabric with a cute bow detail.',        750.00,  'Kids',             'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/f/r/frock.jpg',       45),

-- Men''s Casual
('Men Casual Shirt',   'Smart casual shirt for men. Great for office or weekend wear.',                899.00,  'Men''s Casual',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/m/c/mc1.jpg',        110),
('Men Polo',           'Slim fit polo shirt. Premium piqué cotton, ribbed collar.',                    750.00,  'Men''s Casual',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/p/o/polo2.jpg',      95),
('Men Jacket',         'Lightweight windbreaker jacket. Water-resistant shell, ideal for travel.',     1999.00, 'Men''s Casual',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/j/a/jacket.jpg',     50),
('Denim Shorts',       'Casual denim shorts for men. Relaxed fit with multiple pockets.',             549.00,  'Men''s Casual',    'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/d/s/denim-shorts.jpg', 130),

-- Women''s Dress
('Floral Maxi Dress',  'Flowing maxi dress with a vibrant floral print. Ideal for beach holidays.',   1299.00, 'Women''s Dress',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/f/l/floral-maxi.jpg',  35),
('Black Formal Dress', 'Sophisticated knee-length black dress. A timeless wardrobe staple.',          1799.00, 'Women''s Dress',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/b/l/black-formal.jpg', 40),
('Wrap Dress',         'Versatile wrap dress with adjustable tie. Flattering for all body types.',    1100.00, 'Women''s Dress',   'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/w/r/wrap-dress.jpg',  55),

-- Accessories
('Sunglasses',         'Polarized UV400 sunglasses. Lightweight titanium frame.',                      349.00,  'Accessories',      'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/u/sunglasses.jpg',  200),
('Leather Belt',       'Genuine leather belt with a brushed metal buckle. Fits 28" to 42".',          299.00,  'Accessories',      'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/l/e/leather-belt.jpg', 175),
('Tote Bag',           'Spacious canvas tote bag. Eco-friendly and machine washable.',                 449.00,  'Accessories',      'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/t/o/tote-bag.jpg',   90),
('Wrist Watch',        'Minimalist wrist watch with a stainless steel strap. Water resistant 50m.',   1499.00, 'Accessories',      'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/w/a/watch.jpg',      60),

-- Footwear
('Sneakers',           'Classic white canvas sneakers. Rubber sole with lace-up closure.',             999.00,  'Footwear',         'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/n/sneakers.jpg',   110),
('Ankle Boots',        'Stylish ankle boots with a low block heel. Faux leather, side zip.',          1599.00, 'Footwear',         'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/a/n/ankle-boots.jpg', 45),
('Sandals',            'Comfortable flat sandals with adjustable straps. Perfect for summer.',         699.00,  'Footwear',         'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/a/sandals.jpg',   130),

-- Sports
('Sports Bra',         'High-support sports bra with moisture-wicking fabric. Ideal for running.',    650.00,  'Sports',           'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/s/p/sports-bra.jpg',  80),
('Yoga Pants',         'Full-length yoga pants with a wide waistband. Four-way stretch.',             850.00,  'Sports',           'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/y/o/yoga-pants.jpg', 95),
('Running Shoes',      'Lightweight running shoes with responsive cushioning. Breathable mesh upper.', 1799.00, 'Sports',           'https://automationexercise.com/pub/media/catalog/product/cache/1/image/800x/17f82f742ece5090cd496d8b9aab4c82/r/u/running-shoes.jpg', 70);
GO

PRINT 'ECommerceDB created and seeded successfully.';
GO
