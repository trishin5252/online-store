const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

let products = [
    { id: nanoid(6), name: 'Ноутбук ASUS', category: 'Электроника', description: 'Мощный ноутбук для работы', price: 55000, quantity: 15 },
    { id: nanoid(6), name: 'Мышь Logitech', category: 'Аксессуары', description: 'Беспроводная мышь', price: 1500, quantity: 50 },
    { id: nanoid(6), name: 'Клавиатура Razer', category: 'Аксессуары', description: 'Механическая клавиатура', price: 8000, quantity: 30 },
    { id: nanoid(6), name: 'Монитор Samsung', category: 'Электроника', description: '27 дюймов, 4K', price: 25000, quantity: 20 },
    { id: nanoid(6), name: 'Наушники Sony', category: 'Аудио', description: 'Шумоподавление', price: 12000, quantity: 40 },
    { id: nanoid(6), name: 'Веб-камера Logitech', category: 'Аксессуары', description: 'Full HD 1080p', price: 4500, quantity: 25 },
    { id: nanoid(6), name: 'SSD диск 500GB', category: 'Комплектующие', description: 'Высокая скорость', price: 3500, quantity: 60 },
    { id: nanoid(6), name: 'Оперативная память 16GB', category: 'Комплектующие', description: 'DDR4 3200MHz', price: 5000, quantity: 35 },
    { id: nanoid(6), name: 'Блок питания 600W', category: 'Комплектующие', description: 'Сертификат 80+', price: 4000, quantity: 20 },
    { id: nanoid(6), name: 'Коврик для мыши', category: 'Аксессуары', description: 'Большой, с подсветкой', price: 1000, quantity: 100 },
];

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

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
        quantity: Number(quantity) || 0
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

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Бэкенд запущен на http://localhost:${port}`);
});
