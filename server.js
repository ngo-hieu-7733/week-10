require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('MongoDB connected');
	})
	.catch((err) => console.log('>>> DB error: ', err));

const UserSchema = new mongoose.Schema({
	name: String,
	email: String,
	age: Number,
});

const User = mongoose.model('User', UserSchema);

app.get('/api/users', async (req, res) => {
	try {
		const users = await User.find();
		res.json({
			message: 'Mock GET: List of users',
			data: users,
		});
	} catch (error) {
		console.log('>>> GET /users err: ', error);
	}
});

app.post('/api/users', async (req, res) => {
	try {
		const { name, email, age } = req?.body;
		const user = new User({ name, email, age });
		await user.save();
		res.json({
			message: 'Mock POST: User created',
			data: user,
		});
	} catch (error) {
		console.log('>>> POST /api/users err: ', error);
	}
});

app.put('/api/users/:id', async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req?.params?.id, req?.body);
		res.json({
			message: 'Mock PUT: User updated',
			data: user,
		});
	} catch (error) {
		console.log('>>> PUT /api/users/id err: ', error);
	}
});

app.delete('/api/users/:id', async (req, res) => {
	try {
		const deletedUser = await User.findByIdAndDelete(req?.params?.id);
		res.json({
			message: 'Mock Delete: User deleted',
			data: deletedUser,
		});
	} catch (error) {
		console.log('>>> DELETE /api/users/id err: ', error);
	}
});

app.get('/', (req, res) => {
	res.send('hello world');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log('Express is listening on port ', PORT);
});
