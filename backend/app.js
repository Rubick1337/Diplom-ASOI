require("dotenv").config()
const express = require('express');
const app = express()
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8500;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});