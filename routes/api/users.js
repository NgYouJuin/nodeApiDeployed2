const express = require('express');
const _ = require('lodash')
const router = express.Router();
const gravatar = require('gravatar');
const bycrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth')
const ObjectId = require('mongodb').ObjectID;
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route  GET api/users
// @desc   Test route
// @access Public
router.get('/', (req, res) => res.send("User Route"))

// @route  GET api/users
// @desc   Register user
// @access Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
    .isLength({min: 6})
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }

    const {name, email, password} = req.body;

    try {
        // See if user exists
        let user = await User.findOne({email});

        if(user) {
            return res.status(400).json(
                {
                    errors: [{msg: 'User already exists'}]
                }
            );
        }

        // Get Users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // Encrypt password
        const salt = await bycrypt.genSalt(10);

        user.password = await bycrypt.hash(password, salt);

        await user.save();

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json({token})
            }
        );
    } catch(err) {
        console.error(err.message);
        return res.status(500).send('Server error')
    }
})

// @route  PUT api/users/:id
// @desc   Update user
// @access Private

router.put('/:id', auth, async (req, res) => {
    try {
        let userWithDuplicateEmail = null;
        if(req.body.email){
            userWithDuplicateEmail = await User.findOne({email: req.body.email, "_id": {$ne: ObjectId(req.params.id.toString())}})
            console.log(userWithDuplicateEmail)
        }
        if(userWithDuplicateEmail !== null) return res.status(500).json({msg: "Email is taken"})
        let user = await User.findById(req.params.id)
        if(req.body.password){
            // Encrypt password
            const salt = await bycrypt.genSalt(10);

            req.body.password = await bycrypt.hash(req.body.password, salt);
        }
        if(req.body.email !== user.email){
            const avatar = gravatar.url(req.body.email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })
            req.body.avatar = avatar
        }
        user = _.extend(user, req.body);
        user.save()
        Post.updateMany({user: ObjectId(req.params.id)}, {$set: {name: req.body.name, avatar: req.body.avatar} })
        .then(result => {
            return res.json(user)
        })
        res.json(user)
    }catch(err) {
        console.error(err.message);
        return res.status(500).send('Server error')
    }
})

module.exports = router;