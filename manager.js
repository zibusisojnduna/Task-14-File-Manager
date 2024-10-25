// app.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'shopping-list.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Ensure JSON file exists
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

// Helper function to read shopping list
const readShoppingList = () => {
    const data = fs.readFileSync(FILE_PATH);
    return JSON.parse(data);
};

// Helper function to write shopping list
const writeShoppingList = (list) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2));
};

// Create the server
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/shopping-list') {
        const shoppingList = readShoppingList();
        res.writeHead(200);
        res.end(JSON.stringify(shoppingList));
    } else if (req.method === 'POST' && req.url === '/shopping-list') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const item = JSON.parse(body);
            if (!item.name || item.quantity <= 0) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'Invalid item' }));
            }
            const shoppingList = readShoppingList();
            shoppingList.push(item);
            writeShoppingList(shoppingList);
            res.writeHead(201);
            res.end(JSON.stringify(item));
        });
    } else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
        const id = req.url.split('/').pop();
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedItem = JSON.parse(body);
            const shoppingList = readShoppingList();
            const itemIndex = shoppingList.findIndex(item => item.id === id);
            if (itemIndex === -1 || !updatedItem.name || updatedItem.quantity <= 0) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'Invalid update' }));
            }
            shoppingList[itemIndex] = updatedItem;
            writeShoppingList(shoppingList);
            res.writeHead(200);
            res.end(JSON.stringify(updatedItem));
        });
    } else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
        const id = req.url.split('/').pop();
        const shoppingList = readShoppingList();
        const newList = shoppingList.filter(item => item.id !== id);
        if (newList.length === shoppingList.length) {
            res.writeHead(404);
            return res.end(JSON.stringify({ error: 'Item not found' }));
        }
        writeShoppingList(newList);
        res.writeHead(204);
        res.end();
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
