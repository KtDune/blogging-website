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
import Comment from './Schema/Comment.js'
import { ServerError } from './ServerError.js';
import is_number from 'is-number';

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
        throw new ServerError('No access token', { code: 401 })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            throw new ServerError('Access token is invalid', { code: 401 })
        }

        req.user = user.id
        next()
    })

}

function isPlainObject(value) {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
    )
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

// TODO: Implement string type checking for backend
// TODO: Make sure to change all to either only use async/await or .then syntax
server.post('/signup', async (req, res) => {
    try {
        let { fullName, email, password } = req.body;

        // Validate input
        if (typeof fullName !== 'string' || fullName.length < 3) {
            throw new ServerError('Full name must be at least 3 letters long', { code: 400 });
        }

        if (typeof email !== 'string' || !email.length) {
            throw new ServerError('Please enter an email', { code: 400 });
        }

        if (!emailRegex.test(email)) {
            throw new ServerError('Invalid email format', { code: 400 });
        }

        if (!password || typeof password !== 'string') {
            throw new ServerError('Please enter a password', { code: 400 });
        }

        if (!passwordRegex.test(password)) {
            throw new ServerError('Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters', { code: 400 });
        }

        // Hash password
        const hashed_password = await bcrypt.hash(password, 10);

        const username = await generateUsername(email);

        const user = new User({
            personal_info: {
                fullname: fullName,
                email,
                password: hashed_password,
                username,
            },
        });

        const savedUser = await user.save();
        return res.status(200).json(formatResult(savedUser));

    } catch (err) {
        if (err.code === 11000) {
            return res.status(err.code || 500).json({ error: "Email already exist" });
        } else {
            return res.status(err.code || 500).json({ error: err.message });
        }
    }
})

server.post('/signin', async (req, res) => {
    let { email, password } = req.body

    try {
        const result = await User.findOne({ "personal_info.email": email });

        if (!result) {
            throw new ServerError("User not found", { code: 404 });
        }

        if (result.google_auth) {
            throw new ServerError('Account was created using Google. Try logging in with Google.', { code: 400 });
        }

        const passwordMatch = await bcrypt.compare(password, result.personal_info.password);

        if (!passwordMatch) {
            throw new ServerError("Incorrect password", { code: 401 });
        }

        return res.status(200).json(formatResult(result));

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
});


server.post('/google-auth', async (req, res) => {
    const { access_token } = req.body;

    try {
        const decodedUser = await getAuth().verifyIdToken(access_token);
        let { email, name, picture } = decodedUser;

        picture = picture.replace('s96-c', 's384-c');

        let user = await User
            .findOne({ "personal_info.email": email })
            .select('personal_info.fullname personal_info.username personal_info.profile_img google_auth');

        if (user) {
            if (!user.google_auth) {
                throw new ServerError('This account was signed in without Google. Please use an email and password to sign in.', { code: 400 });
            }
        } else {
            const username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, username },
                google_auth: true,
            });

            user = await user.save();
        }

        return res.status(200).json(formatResult(user));

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
})


server.post('/latest-blog', async (req, res) => {
    const { page } = req.body;
    const maxLimit = 5;

    if (!is_number(page) || !Number.isFinite(page)) {
        throw new ServerError('Please give a valid number', { code: 403 })
    }

    // Prevent negative num
    page = Math.max(0, (page - 1) * maxLimit)

    try {
        const total = await Blog.count({});

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        return res.status(200).json({ blogs, total });

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
});


server.get('/trending-blog', async (req, res) => {
    const maxLimit = 5;

    try {
        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .limit(maxLimit);

        return res.status(200).json({ blogs });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

server.post('/search-blog', async (req, res) => {
    const { page, query, author, eliminate_blog } = req.body;

    let findQuery = {};
    const maxLimit = 5;

    try {
        // Construct the query
        if (query && typeof query === 'string') {
            if (query.charAt(0) === '@') {
                findQuery = {
                    tags: new RegExp(query.slice(1), 'i'),
                    draft: false,
                    blog_id: { $ne: eliminate_blog }
                };
            } else {
                findQuery = {
                    draft: false,
                    title: new RegExp(query, 'i')
                };
            }
        } else if (author) {
            findQuery = { author, draft: false };
        } else {
            throw new ServerError('Invalid input.', { code: 400 });
        }

        // Count matching blogs
        const total = await Blog.count(findQuery);

        // Fetch matching blogs
        const blogs = await Blog.find(findQuery)
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        return res.status(200).json({ blogs, total });

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
})

server.post('/search-user', async (req, res) => {

    const { query } = req.body

    if (!query || typeof query !== 'string') {
        return res.status(403).json({ error: 'Please provide a valid string.' })
    }

    User.find({ 'personal_info.username': new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
        .then(user => res.status(200).json(user))
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/update-profile-img', verifyJWT,async (req, res) => {

    const { url } = req.body

    if (!url || typeof url !== 'string') {
        return res.status(403).json({ error: 'Please provide a valid url.' })
    }

    await User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
    .then(() => res.status(200).json({ "profile_img": url }))
    .catch((error) => res.status(500).json({ error: 'Unable to upload image.' }))

})

server.post('/update-profile', verifyJWT,async (req, res) => {

    const { username, bio, social_links } = req.body
    const bioLimit = 200

    if (typeof username !== 'string' || username.length < 3) {
        return res.status(403).json({ error: 'Username shhould be at least 3 letters long.' })
    }

    if (typeof bio != 'string' || bio.length >= bioLimit) {
        return res.status(403).json({ error: 'Bio should not be more than ' + bioLimit + ' characters.' })
    }

    if (!isPlainObject(social_links)) {
        return res.status(403).json({ error: 'Please provide a valid object.' })
    }

    const socialLinkArr = Object.keys(social_links)

    try {

        for (let i = 0; i < socialLinkArr.length; i++) {
            if (social_links[socialLinkArr[i]]) {
                const hostname = new URL(social_links[socialLinkArr[i]]).hostname

                if (!hostname.includes(`${socialLinkArr[i]}.com`) && socialLinkArr[i] !== 'website') {
                    throw new ServerError(`${socialLinkArr[i]} link is invalid. You must enter a full link.`, { code: 403 })
                }
            }
        }

        const updateObj = {
            'personal_info.username': username,
            'personal_info.bio': bio,
            social_links,
        }

        const result = await User.findOneAndUpdate({ _id: req.user }, updateObj, {
            runValidators: true,
        })

        if (result) {
            return res.status(200).json({  username })
        }
        else {
            throw new ServerError('Unbale to update the profile.', { code: 500 })
        }

    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }

})

server.post('/get-profile', (req, res) => {
    const { username } = req.body

    if (!username || typeof username !== 'string') {
        return res.status(403).json({ error: 'Please proide a valid username.' })
    }

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updateAt -blogs -__v")
        .then(user => res.status(200).json(user))
        .catch(err => res.status(500).json({ error: err.message }))

})

server.post('/create-blog', verifyJWT, async (req, res) => {

    try {
        let author = req.user

        let { title, des, banner, tags, content, draft } = req.body

        if (typeof title !== 'string' || !title.length) {
            throw new ServerError('Please provide a title.', { code: 400 })
        }

        if (typeof draft !== 'boolean') {
            return res.status(403).json({ error: 'Please provide a valid value.' })
        }

        if (!draft) {
            if (typeof des !== 'string' || !des.length || des.length > 200) {
                throw new ServerError('Please provide description under 200 characters.', { code: 400 })
            }

            if (typeof banner !== 'string' || !banner.length) {
                throw new ServerError('Please provide a banner.', { code: 400 })
            }

            if (Array.isArray(content.blocks) || !content.blocks.length) {
                throw new ServerError('Please provide some content to publish.', { code: 400 })
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

        await blog.save().then(async (blog) => {
            const incermentValue = draft ? 0 : 1

            await User.findOneAndUpdate({ _id: author }, {
                $inc: { "account_info.total_posts": incermentValue }, $push: {
                    "blogs": blog._id
                }
            })
                .then(user => res.status(200).json({ id: blog.blog_id }))
                .catch(err => {
                    throw new ServerError("Failed to update total posts number.", { code: 500 })
                })
        })
            .catch(err => {
                throw new ServerError(err.message, { code: 500 })
            })
    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }
})

server.post('/edit-blog', verifyJWT, async (req, res) => {

    try {

        let { title, des, banner, tags, content, draft, id } = req.body

        if (typeof title !== 'string' || !title.length) {
            throw new ServerError('Please provide a title.', { code: 400 })
        }
        
        if (typeof draft !== 'boolean') {
            throw new ServerError('Please provide a valid value.', { code: 400 })
        }

        if (!draft) {
            if (typeof des !== 'string' || !des.length || des.length > 200) {
                throw new ServerError('Please provide description uder 200 characters.', { code: 400 })
            }

            if (!banner.length) {
                throw new ServerError('Please provide a banner.', { code: 400 })
            }

            if (Array.isArray(content.blocks) || !content.blocks.length) {
                throw new ServerError('Please provide some content to publish.', { code: 400 })
            }
        }

        await Blog.findOneAndUpdate({ blog_id: id }, { title, des, banner, content, tags, draft: draft ? draft : false })
            .then(blog => res.status(200).json({ id }))
            .catch(error => {
                throw new ServerError(error.message, { code: 500 })
            })

    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }
})

server.post('/get-blog', async (req, res) => {

    const { blog_id, draft, mode } = req.body
    const incrementVal = mode !== 'edit' ? 1 : 0

    try {

        await Blog.findOneAndUpdate({ blog_id }, { $inc: { 'activity.total_reads': incrementVal } })
            .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
            .select('title des content banner activity publishedAt blog_id tags draft')
            .then(blog => {
                User.findOneAndUpdate({ 'personal_info.username': blog.author.personal_info.username }, { $inc: { 'account_info.total_reads': incrementVal } })
                    .catch(err => {
                        throw new ServerError(err.message, { code: 500 })
                    })

                // Cannot access blog that draft is set to false
                if (blog.draft && !draft) {
                    throw new ServerError('You cannot access draft blog.', { code: 403 })
                }

                return res.status(200).json({ blog })
            })
            .catch(err => {
                throw new ServerError(err.message, { code: 500 })
            })
    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }
})

server.post('/like-blog', verifyJWT, async (req, res) => {

    const user_id = req.user
    const { _id, isLikedByUser } = req.body

    try {

        let incrementVal = !isLikedByUser ? 1 : -1

        await Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
            .then(async (blog) => {
                if (!isLikedByUser) {
                    const like = new Notification({
                        type: 'like',
                        blog: _id,
                        notification_for: blog.author,
                        user: user_id
                    })

                    await like.save()
                        .then(notification => res.status(200).json({ liked_by_user: true }))
                        .catch(err => {
                            throw new ServerError(err.message, { code: 500 })
                        })
                }
                else {
                    await Notification.findOneAndDelete({ user: user_id, blog: _id, type: 'like' })
                        .then(result => res.status(200).json({ liked_by_user: false }))
                        .catch(err => {
                            throw new ServerError(err.message, { code: 500 })
                        })
                }
            })
    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }

})

server.post('/is-liked-by-user', verifyJWT, async (req, res) => {
    const user_id = req.user

    const { _id } = req.body

    await Notification.exists({ user: user_id, type: 'like', blog: _id })
        .then(result => res.status(200).json({ result }))
        .catch(err => res.status(500).json({ error: err.message }))
})

server.post("/add-comment", verifyJWT, async (req, res) => {
    let user_id = req.user;
    const { _id, comment, blog_author, replying_to } = req.body

    try {

        if (typeof comment !== 'string' || !comment.length) {
            throw new ServerError("Write something to leave a comment.", { code: 400 })
        }

        if (
            typeof _id !== 'string'
            || typeof blog_author !== 'string'
        ) {
            throw new ServerError('Please provide a valid value', { code: 403 })
        }

        const commentObj = {
            blog_id: _id,
            blog_author,
            comment,
            commented_by: user_id,
            isReply: Boolean(replying_to) ? true : false,
        }

        if (typeof replying_to !== 'string') {
            throw new ServerError('Please provide a valid value', { code: 403 })
        }

        if (replying_to) {
            commentObj.parent = replying_to
        }

        await new Comment(commentObj)
            .save()
            .then(async (commentFile) => {
                const { comment, commentedAt, children } = commentFile;

                await Blog.findOneAndUpdate({ _id }, {
                    $push: { comments: commentFile._id },
                    $inc: { "activity.total_comments": 1, "activity.total_parent_comments": replying_to ? 0 : 1 },
                }).catch((err) => {
                    throw new ServerError(err.message, { code: 500 })
                })

                const notificationObj = {
                    type: replying_to ? "reply" : "comment",
                    blog: _id,
                    notification_for: blog_author,
                    user: user_id,
                    comment: commentFile._id
                }

                if (replying_to) {
                    notificationObj.replied_on_comment = replying_to

                    await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } })
                        .then(reply => { notificationObj.notification_for = reply.commented_by })
                        .catch(err => {
                            throw new ServerError(err.message, { code: 500 })
                        })
                }

                await new Notification(notificationObj).save()
                    .catch((err) => {
                        throw new ServerError(err.message, { code: 500 })
                    })

                return res.status(200).json(commentFile);
            })
            .catch((error) => {
                throw new ServerError(error.message, { code: 500 })
            });

    }
    catch (err) {
        return res.status(err.code || 500).json(err.message)
    }

})


server.post('/get-blog-comments', async (req, res) => {

    const { blog_id, skip, replyingTo } = req.body
    let maxLimit = 5

    if (!is_number(skip) || typeof replyingTo !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    try {

        let commentObj = {}

        if (replyingTo) {
            commentObj = { blog_id, isReply: true, parent: replyingTo }
        }
        else {
            commentObj = { blog_id, isReply: false }
        }

        await Comment.find(commentObj)
            .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
            .skip(skip)
            .limit(maxLimit)
            .sort({
                "commentedAt": -1
            })
            .then(comment => {
                return res.status(200).json(comment)
            })
            .catch(error => {
                throw new ServerError(error.message, { code: 500 })
            })


    }
    catch (err) {
        return res.status(err.code || 500).json(err.message)
    }

})

const deleteComment = async (_id) => {

    await Comment.findOneAndDelete({ _id })
        .then(async (cmt) => {
            if (cmt.isReply) {
                await Comment.findOneAndUpdate({ _id: cmt.parent }, { $pull: { children: _id } })
                    .then(data => { })
                    .catch(err => {
                        throw new ServerError(err.message, { code: 500 })
                    })
            }

            if (cmt.children) {
                cmt.children.map(async (item) => {
                    await deleteComment(item)
                })
            }

            await Notification.findOneAndDelete({ comment: _id })
                .then(noti => { })
                .catch(err => {
                    throw new ServerError(err.message, { code: 500 })
                })

            await Notification.findOneAndDelete({ reply: _id })
                .then(noti => { })
                .catch(err => {
                    throw new ServerError(err.message, { code: 500 })
                })

            await Blog.findOneAndUpdate({ _id: cmt.blog_id }, { $inc: { "activity.total_comments": -1, "activity.total_parent_comments": cmt.isReply ? 0 : -1 } })
                .then(blog => { })
                .catch(err => {
                    throw new ServerError(err.message, { code: 500 })
                })
                .catch(err => {
                    throw new ServerError(err.message, { code: 500 })
                })
        })

}

server.post('/delete-comment', verifyJWT, async (req, res) => {

    try {

        const user_id = req.user

        const { _id } = req.body

        if (typeof _id !== 'string') {
            throw new ServerError('Please provide a valid value.', { code: 400 })
        }

        await Comment.findOne({ _id })
            .then(async (cmt) => {
                if (user_id === cmt.commented_by.toString() || user_id === cmt.blog_author.toString()) {
                    await deleteComment(_id)

                    return res.status(200).json({ status: 'Done' })
                }
                else {
                    throw new ServerError('You cannot delete this comment.', { code: 401 })
                }
            })
    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }
})

// TODO: Implement forgot password on user login page, an email needs to be sent to the user to verify if the account holder is sending the change password request.
// TODO: currentPassword and newPassword should not be the same
server.post('/change-password', verifyJWT, async (req, res) => {
    const user_id = req.user;
    const { currentPassword, newPassword } = req.body

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    throw new ServerError('Please provide a valid value.', { code: 400 })
    }

    try {
        // Validate passwords
        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            throw new ServerError(
                'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letter',
                { code: 403 }
            );
        }

        // Fetch user
        const user = await User.findOne({ _id: user_id });
        if (!user) {
            throw new ServerError('User not found', { code: 404 });
        }

        if (user.google_auth) {
            throw new ServerError('You cannot reset password as you are logged in with Google.', { code: 403 });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(currentPassword, user.personal_info.password);
        if (!isMatch) {
            throw new ServerError('Incorrect current password', { code: 403 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.findOneAndUpdate(
            { _id: user_id },
            { "personal_info.password": hashedPassword }
        );

        return res.status(200).json({ status: "Password changed." });

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})