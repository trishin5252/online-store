const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Создаём папку для изображений, если не существует
const uploadDir = path.join(__dirname, 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${nanoid(10)}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Максимум 5MB
});

let products = [
    { id: nanoid(6), name: 'Ноутбук ASUS', category: 'Электроника', description: 'Мощный ноутбук для работы', price: 55000, quantity: 15, imageUrl: null },
    { id: nanoid(6), name: 'Мышь Logitech', category: 'Аксессуары', description: 'Беспроводная мышь', price: 1500, quantity: 50, imageUrl: null },
    { id: nanoid(6), name: 'Клавиатура Razer', category: 'Аксессуары', description: 'Механическая клавиатура', price: 8000, quantity: 30, imageUrl: null },
    { id: nanoid(6), name: 'Монитор Samsung', category: 'Электроника', description: '27 дюймов, 4K', price: 25000, quantity: 20, imageUrl: null },
    { id: nanoid(6), name: 'Наушники Sony', category: 'Аудио', description: 'Шумоподавление', price: 12000, quantity: 40, imageUrl: null },
    { id: nanoid(6), name: 'Веб-камера Logitech', category: 'Аксессуары', description: 'Full HD 1080p', price: 4500, quantity: 25, imageUrl: null },
    { id: nanoid(6), name: 'SSD диск 500GB', category: 'Комплектующие', description: 'Высокая скорость', price: 3500, quantity: 60, imageUrl: null },
    { id: nanoid(6), name: 'Оперативная память 16GB', category: 'Комплектующие', description: 'DDR4 3200MHz', price: 5000, quantity: 35, imageUrl: null },
    { id: nanoid(6), name: 'Блок питания 600W', category: 'Комплектующие', description: 'Сертификат 80+', price: 4000, quantity: 20, imageUrl: null },
    { id: nanoid(6), name: 'Коврик для мыши', category: 'Аксессуары', description: 'Большой, с подсветкой', price: 1000, quantity: 100, imageUrl: null },
];

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Раздача статических файлов (изображений)
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===== CRUD для товаров =====

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, quantity } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name и price обязательны' });
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category || 'Без категории',
        description: description || '',
        price: Number(price),
        quantity: Number(quantity) || 0,
        imageUrl: null
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    const { name, category, description, price, quantity } = req.body;
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
    const exists = products.some(p => p.id === req.params.id);
    if (!exists) return res.status(404).json({ error: 'Товар не найден' });
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

// ===== НОВЫЕ ENDPOINTS ДЛЯ ИЗОБРАЖЕНИЙ =====

// Загрузка/замена изображения товара
app.post('/api/products/:id/image', upload.single('image'), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    // Удаляем старое изображение, если было
    if (product.imageUrl) {
        const oldPath = path.join(__dirname, 'uploads', 'images', path.basename(product.imageUrl));
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }
    }
    
    // Сохраняем URL нового изображения
    product.imageUrl = `/uploads/images/${req.file.filename}`;
    
    res.json({ 
        message: 'Изображение загружено', 
        product: product 
    });
});

// Удаление изображения товара
app.delete('/api/products/:id/image', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    
    if (product.imageUrl) {
        const imagePath = path.join(__dirname, 'uploads', 'images', path.basename(product.imageUrl));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        product.imageUrl = null;
    }
    
    res.json({ message: 'Изображение удалено', product: product });
});

// ===== ОБРАБОТЧИКИ ОШИБОК =====

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой (макс. 5MB)' });
        }
        return res.status(400).json({ error: err.message });
    }
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Бэкенд запущен на http://localhost:${port}`);
});