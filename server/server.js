import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid';
import cors from 'cors'
import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'

import User from './Schema/User.js'
import Blog from './Schema/Blog.js'
import Notification from './Schema/Notification.js'

const server = express()

let PORT = 8080
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json())
server.use(cors())

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_JSON))
})

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
})

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'No access token' })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Access token is invalid' })
        }

        req.user = user.id
        next()
    })

}

const generateUsername = async (email) => {
    let username = email.split('@')[0]

    let usernameExist = await User.exists({ "personal_info.username": username })
        .then((res) => res)

    usernameExist ? username += nanoid().substring(0, 5) : ""

    return username
}

const formatResult = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    }
}

server.post('/signup', (req, res) => {
    let { fullName, email, password } = req.body

    // validating data from frontend
    if (fullName.length < 3) {
        return res.status(403).json({ error: 'Full name must be at least 3 letters long' })
    }

    if (!email.length) {
        return res.status(403).json({ error: 'Please enter an email' })
    }

    if (!emailRegex.test(email)) {
        return res.status(403).json({ error: 'Invalid email format' })
    }

    if (!password) {
        return res.status(403).json({ error: 'Please enter a password' })
    }

    if (!passwordRegex.test(password)) {
        return res.status(403).json({ error: 'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters' })
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email)
        let user = new User({
            personal_info: { fullname: fullName, email, password: hashed_password, username }
        })

        user.save()
            .then((u) => {
                return res.status(200).json(formatResult(u))
            })
            .catch((err) => {
                if (err.code === 11000) { // mongodb mongoose duplication error
                    return res.status(500).json({ error: "Email already exist" })
                }
                return res.status(500).json({ error: err.message })
            })
    })
})

server.post('/signin', async (req, res) => {
    let { email, password } = req.body

    try {
        const result = await User.findOne({ "personal_info.email": email })

        if (!result) {
            return res.status(403).json({ error: "User not found" })
        }

        if (!result.google_auth) {
            bcrypt.compare(password, result.personal_info.password, (err, hashResult) => {
                if (err) {
                    return res.status(403).json({ error: "Error occured while login please try again" })
                }

                if (!hashResult) {
                    return res.status(403).json({ error: "Incorrect password" })
                }
                else {
                    return res.status(200).json(formatResult(result))

                }
            })
        }
        else {
            return res.status(403).json({ error: 'Account was created using Google. Try logging in with Google.' })
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message })
    }
})

server.post('/google-auth', async (req, res) => {
    const { access_token } = req.body

    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodeduser) => {

            let { email, name, picture } = decodeduser

            picture = picture.replace('s96-c', 's384-c')

            let user = await User
                .findOne({ "personal_info.email": email })
                .select('personal_info.fullname personal_info.username personal_info.profile_img google_auth')
                .then((u) => { return u || null })
                .catch((err) => res.status(500).json({ error: err.message }))

            if (user) {
                if (!user.google_auth) {
                    res.status(403).json({ error: 'This account was signned in without Google. Please use an email and password to sign in.' })
                }
            }
            else {

                let username = await generateUsername(email)

                user = new User({
                    personal_info: { fullname: name, email, username, },
                    google_auth: true,
                })

                await user.save().then((u) => {
                    user = u
                })
                    .catch((err) => {
                        return res.status(500).json({ error: err.message })
                    })
            }

            return res.status(200).json(formatResult(user))
        })
        .catch((err) => res.status(500).json({ error: err.message }))
})

server.post('/latest-blog', (req, res) => {

    const { page } = req.body
    const maxLimit = 5
    let total = 0

    Blog.count({})
        .then(result => { total = result })
        .catch(err => res.status(500).json({ error: err }))

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(data => {
            res.status(200).json({ blogs: data, total })
        })
        .catch(err => res.status(500).json({ error: err.message }))

})

server.get('/trending-blog', (req, res) => {
    const maxLimit = 5

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .limit(maxLimit)
        .then(data => {
            res.status(200).json({ blogs: data })
        })
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/search-blog', (req, res) => {

    const { page, query, author , eliminate_blog } = req.body

    let findQuery = {}
    const maxLimit = 5
    let total = 0


    if (query) {
        if (query.charAt(0) === '@') {
            findQuery = { tags: new RegExp(query.slice(1), 'i'), draft: false, blog_id: { $ne: eliminate_blog } }
        }
        else {
            findQuery = { draft: false, title: new RegExp(query, 'i') }
        }
    }
    else if (author) {
        findQuery = { author, draft: false }
    }
    else {
        return res.status(403).json({ error: 'Invalid input.' })
    }


    Blog.count(findQuery)
        .then(result => { total = result })
        .catch(err => res.status(500).json({ error: err }))

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(data => {
            res.status(200).json({ blogs: data, total })
        })
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/search-user', (req, res) => {

    const { query } = req.body

    User.find({ 'personal_info.username': new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
        .then(user => res.status(200).json(user))
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/get-profile', (req, res) => {
    const { username } = req.body

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updateAt -blogs -__v")
        .then(user => res.status(200).json(user))
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/create-blog', verifyJWT, (req, res) => {

    let author = req.user

    let { title, des, banner, tags, content, draft } = req.body

    if (!title.length) {
        return res.status(403).json({ error: 'Please provide a title.' })
    }

    if (!draft) {
        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: 'Please provide description uder 200 characters.' })
        }

        if (!banner.length) {
            return res.status(403).json({ error: 'Please provide a banner.' })
        }

        if (!content.blocks.length) {
            return res.status(403).json({ error: 'Please provide some content to publish.' })
        }
    }

    const blogId = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, '-').trim() + nanoid()

    const blog = new Blog({
        title,
        des,
        banner,
        tags,
        content,
        author,
        blog_id: blogId,
        draft: Boolean(draft),
    })

    blog.save().then(blog => {
        const incermentValue = draft ? 0 : 1

        User.findOneAndUpdate({ _id: author }, {
            $inc: { "account_info.total_posts": incermentValue }, $push: {
                "blogs": blog._id
            }
        })
            .then(user => res.status(200).json({ id: blog.blog_id }))
            .catch(err => res.status(500).json({ error: "Failed to update total posts number." }))
    })
        .catch(err => res.status(500).json({ error: err.message }))
})

server.post('/edit-blog', verifyJWT, (req, res) => {

    let author = req.user

    let { title, des, banner, tags, content, draft, id } = req.body

    if (!title.length) {
        return res.status(403).json({ error: 'Please provide a title.' })
    }

    if (!draft) {
        if (!des.length || des.length > 200) {
            return res.status(403).json({ error: 'Please provide description uder 200 characters.' })
        }

        if (!banner.length) {
            return res.status(403).json({ error: 'Please provide a banner.' })
        }

        if (!content.blocks.length) {
            return res.status(403).json({ error: 'Please provide some content to publish.' })
        }
    }

    Blog.findOneAndUpdate({ blog_id: id }, { title, des, banner, content, tags, draft: draft ? draft : false })
    .then(blog => res.status(200).json({id}))
    .catch(error => res.status(500).json({ error: error.message }))

})

server.post('/get-blog', (req, res) => {

    const { blog_id, draft, mode } = req.body
    const incrementVal = mode !== 'edit' ? 1 : 0

    Blog.findOneAndUpdate({ blog_id }, { $inc: { 'activity.total_reads': incrementVal } })
    .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
    .select('title des content banner activity publishedAt blog_id tags draft')
    .then(blog => {
        User.findOneAndUpdate({ 'personal_info.username': blog.author.personal_info.username }, { $inc: { 'account_info.total_reads': incrementVal } })
        .catch(err => res.status(500).json({ error: err.message }))

        // Cannot access blog that draft is set to false
        if (blog.draft && !draft) {
            res.status(500).json({ error: 'You cannot access draft blog.' })
        }

        return res.status(200).json({ blog })
    })
    .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/like-blog', verifyJWT, (req, res) => {

    const user_id = req.user
    const { _id, isLikedByUser } = req.body

    let incrementVal = !isLikedByUser ? 1 : -1

    Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
    .then(blog => {
        if (!isLikedByUser) {
            const like = new Notification({
                type: 'like',
                blog: _id,
                notification_for: blog.author,
                user: user_id
            })

            like.save()
            .then(notification => res.status(200).json({ liked_by_user: true }))
            .catch(err => res.status(500).json({ error: err.message }))
        }
        else {
            Notification.findOneAndDelete({ user: user_id, blog: _id, type: 'like' })
            .then(result => res.status(200).json({ liked_by_user: false }))
            .catch(err => res.status(500).json({ error: err.message }))
        }
    })

})

server.post('/is-liked-by-user', verifyJWT, (req, res) => {
    const user_id = req.user

    const { _id } = req.body

    Notification.exists({ user: user_id, type: 'like', blog: _id })
    .then(result => res.status(200).json({ result }))
    .catch(err => res.status(500).json({ error: err.message }))
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})