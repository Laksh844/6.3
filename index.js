const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const MONGO_URI = 'mongodb://localhost:27017/bankDB';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true,
        min: 0
    }
});

const User = mongoose.model('User', userSchema);

app.post('/create-users', async (req, res) => {
    try {
        await User.deleteMany({});
        
        const users = await User.create([
            { name: 'Alice', balance: 500 },
            { name: 'Bob', balance: 500 }
        ]);
        
        res.status(201).json({
            Message: "Users created",
            users: users
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating users', error: error.message });
    }
});

app.post('/transfer', async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;

    const transferAmount = Number(amount);

    if (!transferAmount || transferAmount <= 0) {
        return res.status(400).json({ message: 'Invalid transfer amount' });
    }

    try {
        const fromAccount = await User.findById(fromAccountId);
        const toAccount = await User.findById(toAccountId);

        if (!fromAccount) {
            return res.status(404).json({ message: 'Sender account not found' });
        }
        if (!toAccount) {
            return res.status(404).json({ message: 'Receiver account not found' });
        }

        if (fromAccount.balance < transferAmount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        fromAccount.balance -= transferAmount;
        toAccount.balance += transferAmount;

        await fromAccount.save();
        await toAccount.save();

        res.status(200).json({
            message: `Transferred ${transferAmount} from ${fromAccount.name} to ${toAccount.name}.`,
            senderBalance: fromAccount.balance,
            receiverBalance: toAccount.balance
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during transfer', error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});