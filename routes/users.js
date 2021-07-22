const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticate } = require('./auth')
const { User }  = require('../models/user');

router.get('/users', authenticate, (request, response) => {
    User.query()
        .then(users => response.json(users));
});

router.post('/users', (request, response) => {
    const { user } = request.body;
    const saltRounds = 12;
    bcrypt.hash(user.password, saltRounds)
        .then(hashedPassword => {
            User.query()
                .insert({ username: user.username, password_digest: hashedPassword })
                .then(newUser => response.status(201).json(newUser))
        })
});

router.post('/login', (request, response) => {
    const { user } = request.body;

    User.query()
        .findOne({ username: user.username || '' })
        .then(existingUser => {
            if (!existingUser) {
                response.status(401).json({ error: 'Invalid username or password' })
            } else {
                bcrypt.compare(user.password, existingUser.password_digest)
                    .then(isMatch => {
                        if (!isMatch) {
                            response.status(401).json({ error: 'Invalid username or password'})
                        } else {
                            const secret = process.env.AUTH_SECRET;
                            const payload = { user_id: existingUser.id };
                            const token = jwt.sign(payload, secret);
                            response.status(200).json({ token, user: existingUser });
                        }
                    })
            }
        })
})

module.exports = { usersRouter: router };