require('dotenv').config({ quite: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('MongoDB connected');
	})
	.catch((err) => console.log('>>> DB error: ', err));

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Required'],
		minlength: [2, 'Min length: 2'],
	},
	age: {
		type: Number,
		required: [true, 'Required'],
		min: [0, 'Min value: 0'],
	},
	email: {
		type: String,
		match: [/^\S+@\S+\.\S+$/, 'Incorrect email format'],
	},
	address: String,
});

const User = mongoose.model('User', UserSchema);

app.get('/api/users', async (req, res) => {
	try {
		// Lấy query params
		const page = parseInt(req.query.page) || 1;
		if (page < 0) {
			res.status(400).json({
				error: 'Page must be greater than 0',
			});
		}
		const limit = parseInt(req.query.limit) || 5;
		if (limit < 0 || limit > 5) {
			res.status(400).json({
				error: 'limit must be greater than 0 and smaller than 5',
			});
		}
		const search = req.query.search || '';
		// Tạo query filter cho search
		const filter = search
			? {
					$or: [
						{ name: { $regex: search, $options: 'i' } },
						{ email: { $regex: search, $options: 'i' } },
						{ address: { $regex: search, $options: 'i' } },
					],
			  }
			: {};
		// Tính skip
		const skip = (page - 1) * limit;

		// Query database
		// Đếm tổng số documents
		const [users, total] = await Promise.all([
			await User.find(filter).skip(skip).limit(limit),
			await User.countDocuments(filter),
		]);

		const totalPages = Math.ceil(total / limit);
		// Trả về response
		res.json({
			page,
			limit,
			total,
			totalPages,
			data: users,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

//

app.post('/api/users', async (req, res) => {
	try {
		let { name, email, age, address } = req?.body;

		// TODO: loại bỏ khoảng trắng trong input,
		name = name?.trim()?.toLowerCase();
		email = email?.trim()?.toLowerCase();
		address = address?.trim()?.toLowerCase();

		// Tuổi là số nguyên,
		if (age && !Number.isInteger(age)) {
			return res.status(400).json({
				error: 'Age phải là số nguyên',
			});
		}

		//  email duy nhất,
		const emails = await User.distinct('email');
		console.log(emails);
		if (emails.includes(email)) {
			return res.status(400).json({
				error: 'email đã tồn tại',
			});
		}

		const newUser = await User.create({ name, email, age, address });

		res.status(201).json({
			message: 'Tạo người dùng thành công',
			data: newUser,
		});
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//

app.put('/api/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		let { name, age, email, address } = req.body;

		// TODO: loại bỏ khoảng trắng trong input,
		name = name?.trim()?.toLowerCase();
		email = email?.trim()?.toLowerCase();
		address = address?.trim()?.toLowerCase();

		// Tuổi là số nguyên,
		if (age && !Number.isInteger(age)) {
			return res.status(400).json({
				error: 'Age phải là số nguyên',
			});
		}

		//  email duy nhất,
		const emails = await User.distinct('email');
		console.log(emails);
		if (emails.includes(email)) {
			return res.status(400).json({
				error: 'email đã tồn tại',
			});
		}

		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ name, age, email, address },
			{ new: true, runValidators: true } // Quan trọng
		);
		if (!updatedUser) {
			return res.status(404).json({ error: 'Không tìm thấy người dùng' });
		}
		res.json({
			message: 'Cập nhật người dùng thành công',
			data: updatedUser,
		});
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

//

app.delete('/api/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		//  Id hợp lệ
		const deletedUser = await User.findByIdAndDelete(id);
		if (!deletedUser) {
			return res.status(404).json({ error: 'Không tìm thấy người dùng' });
		}
		res.json({ message: 'Xóa người dùng thành công' });
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

//

app.get('/', (req, res) => {
	res.send('hello world ccc');
});

//

app.listen(port, () => {
	console.log('Express is listening on port ', port);
});
