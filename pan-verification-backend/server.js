const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with an environment variable in production

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect('mongodb://localhost:27017/reactNativeApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  panNumber: { type: String, unique: true, required: true },
});

const User = mongoose.model('User', userSchema);

// Multer Setup for PAN Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// Routes
// 1. Upload PAN Image and Extract Details
app.post('/upload-pan', upload.single('panImage'), (req, res) => {
  const panNumber = 'EXAMPLEPAN1234'; // Replace with actual PAN extraction logic
  res.json({ success: true, panNumber });
});

// 2. User Registration
app.post('/register', async (req, res) => {
  const { email, password, mobile, address, panNumber } = req.body;

  if (!email || !password || !mobile || !address || !panNumber) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, mobile, address, panNumber });

    await user.save();
    res.json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or PAN number already exists.' });
    }
    res.status(500).json({ error: 'Server error.' });
  }
});

// 3. User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
