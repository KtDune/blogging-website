import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid';
import cors from 'cors'
import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import is_number from 'is_number'
import path from 'path'
import multer from 'multer'
import { fileTypeFromBuffer } from 'file-type'
import { createRequire } from 'module'

import User from './Schema/User.js'
import Blog from './Schema/Blog.js'
import Notification from './Schema/Notification.js'
import Comment from './Schema/Comment.js'
import { ServerError } from './ServerError.js'
import { randomUUID } from 'crypto';

const server = express()
const require = createRequire(import.meta.url)

const sharp = require('sharp')

const PORT = 8080
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpeg', 'png', 'jpg', 'webp']

server.use(express.json())
server.use(cors())

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_JSON)),
    storageBucket: process.env.FIREBASE_BUCKET_NAME
})

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: MAX_SIZE, // 3 MB 
})

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized.' })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Access token is invalid.' })
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

const uploadToFirebaseBucket = async (buffer, contentType = "image/webp") => {
    try {
        const storage = getStorage();
        const bucket = storage.bucket();

        // Random file name + webp extension
        const filename = `bannerImg/${randomUUID()}.webp`;

        const fileRef = bucket.file(filename);

        // Save binary buffer directly
        await fileRef.save(buffer, {
            metadata: { contentType },
            resumable: false // speeds up for small files
        });

        // Generate signed URL
        const [url] = await fileRef.getSignedUrl({
            action: "read",
            expires: "08-02-2074",
        })

        return url;
    } catch (error) {
        return null;
    }
}

server.post('/upload-image', upload.single('image'), verifyJWT, async (req, res) => {
    const image = req.file
    if (!image) {
        return res.status(400).json({ error: 'No image uploaded' })
    }

    if (!ALLOWED_MIME.includes(image.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type.' })
    }

    if (image.size > MAX_SIZE) {
        return res.status(400).json({ error: 'File is too large.' })
    }

    try {

        const buffer = await fileTypeFromBuffer(image.buffer)

        if (buffer) {

            if (
                !ALLOWED_EXTENSIONS.includes(buffer.ext)
                || !ALLOWED_MIME.includes(buffer.mime)
            ) {
                return res.status(400).json({ error: 'Please provide data with correct ext / mime types.' })
            }

        }
        else {
            return res.status(500).json({ error: 'Error converting bytes to files.' })
        }

        const resizedBuffer = await sharp(image.buffer)
            .webp({ quality: 75 })
            .toBuffer();

        const url = await uploadToFirebaseBucket(resizedBuffer, "image/webp")

        if (url) {
            return res.status(200).json({ url });
        } else {
            return res.status(500).json({ error: 'Upload failed' });
        }


    }
    catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
})

// DONE: Implement string type checking for backend
// DONE: Make sure to change all to either only use async/await or .then syntax
server.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    // ✅ Validation - return early for expected errors
    if (typeof fullName !== 'string' || fullName.trim().length < 3) {
        return res.status(400).json({ error: 'Full name must be at least 3 letters long' });
    }

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Please enter an email' });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Please enter a password' });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error: 'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters'
        });
    }

    try {
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
            // Duplicate key (likely email)
            return res.status(409).json({ error: "Email already exists" });
        }

        console.error("Unexpected error during signup:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


server.post('/signin', async (req, res) => {
    // ✅ Handle expected errors first, early return
    if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Request body must be a valid object' });
    }

    const { email, password } = req.body;

    if (!(typeof email === 'string' && email.length && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return res.status(400).json({ error: 'Please enter a valid email' });
    }

    if (!(typeof password === 'string' && password.length)) {
        return res.status(400).json({ error: 'Please enter a valid password' });
    }

    try {
        const user = await User.findOne({ "personal_info.email": email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.google_auth) {
            return res.status(400).json({ error: 'Account was created using Google. Try logging in with Google.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.personal_info.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        return res.status(200).json(formatResult(user));

    } catch (err) {
        console.error('Unexpected error during signin:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/google-auth', async (req, res) => {
    const { access_token } = req.body;

    // ✅ Input validation (expected error)
    if (!access_token || typeof access_token !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid access token' });
    }

    try {
        const decodedUser = await getAuth().verifyIdToken(access_token);
        let { email, name, picture } = decodedUser;

        picture = picture?.replace('s96-c', 's384-c');

        let user = await User
            .findOne({ "personal_info.email": email })
            .select('personal_info.fullname personal_info.username personal_info.profile_img google_auth');

        if (user) {
            // ✅ Expected error: existing account not created via Google
            if (!user.google_auth) {
                return res.status(400).json({
                    error: 'This account was signed up without Google. Please use email and password instead.'
                });
            }
        } else {
            // ✅ New user creation
            const username = await generateUsername(email);

            user = new User({
                personal_info: {
                    fullname: name,
                    email,
                    username,
                    profile_img: picture,
                },
                google_auth: true,
            });

            user = await user.save();
        }

        return res.status(200).json(formatResult(user));

    } catch (err) {
        // Firebase throws with a proper message on invalid/expired token
        console.error('Unexpected error during Google auth:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/latest-blog', async (req, res) => {
    try {
        // Validate request body is a plain object
        if (!isPlainObject(req.body)) {
            return res.status(400).json({ error: 'Request body must be a valid object' });
        }

        const { page } = req.body;
        const maxLimit = 5;

        // Validate page is a positive number
        if (!is_number(page) || page < 1) {
            return res.status(400).json({ error: 'Page must be a positive number' });
        }

        const total = await Blog.count({});

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        return res.status(200).json({ blogs, total });

    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' })
    }
})


server.get('/trending-blog', async (req, res) => {
    try {
        // Validate req.query is a plain object (for GET routes)
        if (!isPlainObject(req.query)) {
            return res.status(400).json({ error: 'Query parameters must be a valid object' });
        }

        const maxLimit = 5;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .limit(maxLimit);

        return res.status(200).json({ blogs });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' })
    }
})

server.post('/search-blog', async (req, res) => {
    const { page = 1, query = '', author = '', eliminate_blog = null } = req.body;
    const maxLimit = 5;

    // ✅ Validate input (expected errors)
    if (!query && !author) {
        return res.status(400).json({ error: 'Query or author is required.' });
    }

    if (typeof query !== 'string' || typeof author !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    if (!is_number(page) || page < 1) {
        return res.status(400).json({ error: 'Page must be a positive number.' });
    }

    let findQuery = { draft: false };

    // ✅ Build query based on input
    if (query) {
        if (query.startsWith('@')) {
            findQuery.tags = new RegExp(query.slice(1), 'i');
            if (eliminate_blog) {
                findQuery.blog_id = { $ne: eliminate_blog };
            }
        } else {
            findQuery.title = new RegExp(query, 'i');
        }
    } else if (author) {
        findQuery.author = author;
    }

    try {
        const total = await Blog.count(findQuery);

        const blogs = await Blog.find(findQuery)
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        return res.status(200).json({ blogs, total });

    } catch (err) {
        console.error("Unexpected error in /search-blog:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/search-user', async (req, res) => {
    const { query } = req.body;

    // ✅ Validate input
    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query must be a non-empty string.' });
    }

    try {
        const users = await User.find({
            'personal_info.username': new RegExp(query, 'i')
        })
            .limit(50)
            .select("personal_info.fullname personal_info.username personal_info.profile_img -_id");

        return res.status(200).json(users);

    } catch (err) {
        console.error("Error in /search-user:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/update-profile-img', verifyJWT, async (req, res) => {
    const { url } = req.body;

    // ✅ Input validation
    if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ error: 'Profile image URL is required.' });
    }

    try {
        await User.findOneAndUpdate(
            { _id: req.user },
            { "personal_info.profile_img": url }
        );

        return res.status(200).json({ profile_img: url });

    } catch (err) {
        console.error("Error in /update-profile-img:", err);
        return res.status(500).json({ error: 'Unable to update profile image.' });
    }
})

server.post('/update-profile', verifyJWT, async (req, res) => {
    const { username, bio = '', social_links = {} } = req.body;
    const bioLimit = 200;

    // ✅ Input validation
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username should be at least 3 letters long.' });
    }

    if (typeof bio !== 'string' || bio.length > bioLimit) {
        return res.status(400).json({ error: `Bio should not be more than ${bioLimit} characters.` });
    }

    for (const key of Object.keys(social_links)) {
        const url = social_links[key];

        if (url && typeof url === 'string') {
            try {
                const hostname = new URL(url).hostname;

                if (!hostname.includes(`${key}.com`) && key !== 'website') {
                    return res.status(400).json({ error: `${key} link is invalid. You must enter a full URL.` });
                }

            } catch {
                return res.status(400).json({ error: `${key} link is not a valid URL.` });
            }
        }
    }

    // ✅ Proceed with DB update
    try {
        const updateObj = {
            'personal_info.username': username,
            'personal_info.bio': bio,
            social_links,
        };

        const result = await User.findOneAndUpdate({ _id: req.user }, updateObj, {
            runValidators: true,
        });

        if (!result) {
            return res.status(500).json({ error: 'Unable to update the profile.' });
        }

        return res.status(200).json({ username });

    } catch (err) {
        console.error('Error in /update-profile:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/get-profile', async (req, res) => {
    const { username } = req.body;

    // ✅ Validate input
    if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    try {
        const user = await User.findOne({ "personal_info.username": username })
            .select("-personal_info.password -google_auth -updatedAt -blogs -__v");

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json(user);

    } catch (err) {
        console.error('Error in /get-profile:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

server.post('/create-blog', verifyJWT, async (req, res) => {
    const author = req.user;
    const { title, des = '', banner = '', tags = [], content = {}, draft = false } = req.body;

    // ✅ Input Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Please provide a title.' });
    }

    if (!draft) {
        if (!des.trim() || typeof des !== 'string' || des.length > 200) {
            return res.status(400).json({ error: 'Please provide a description under 200 characters.' });
        }

        if (!banner || typeof banner !== 'string' || !banner.trim()) {
            return res.status(400).json({ error: 'Please provide a banner.' });
        }

        if (!content.blocks || !Array.isArray(content.blocks) || content.blocks.length === 0) {
            return res.status(400).json({ error: 'Please provide some content to publish.' });
        }

        if (tags.length > 0 && (!Array.isArray(tags) || tags.some(item => typeof item !== 'string'))) {
            return res.status(400).json({ error: 'Please provide a valid tag(s).' });
        }
    }

    const blogId = title
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\s+/g, '-')
        .trim()
        .toLowerCase() + '-' + nanoid();

    try {
        const newBlog = new Blog({
            title,
            des,
            banner,
            tags,
            content,
            author,
            blog_id: blogId,
            draft: Boolean(draft),
        });

        const savedBlog = await newBlog.save();

        const incrementValue = draft ? 0 : 1;

        await User.findOneAndUpdate(
            { _id: author },
            {
                $inc: { "account_info.total_posts": incrementValue },
                $push: { blogs: savedBlog._id }
            }
        );

        return res.status(200).json({ id: savedBlog.blog_id });

    } catch (err) {
        console.error('Error creating blog:', err);
        return res.status(500).json({ error: 'Failed to create blog post.' });
    }
})

server.post('/edit-blog', verifyJWT, async (req, res) => {
    const { title, des = '', banner = '', tags = [], content = {}, draft = false, id } = req.body;

    // ✅ Input validation
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Blog ID is required.' });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Please provide a title.' });
    }

    if (!draft) {
        if (!des.trim() || typeof des !== 'string' || des.length > 200) {
            return res.status(400).json({ error: 'Please provide a description under 200 characters.' });
        }

        if (!banner || typeof banner !== 'string' || !banner.trim()) {
            return res.status(400).json({ error: 'Please provide a banner.' });
        }

        if (!content.blocks || !Array.isArray(content.blocks) || content.blocks.length === 0) {
            return res.status(400).json({ error: 'Please provide some content to publish.' });
        }

        if (tags.length > 0 && (!Array.isArray(tags) || tags.some(item => typeof item !== 'string'))) {
            return res.status(400).json({ error: 'Please provide a valid tag(s).' });
        }
    }

    try {
        const updatedBlog = await Blog.findOneAndUpdate(
            { blog_id: id },
            { title, des, banner, content, tags, draft: Boolean(draft) },
            { new: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ error: 'Blog not found.' });
        }

        return res.status(200).json({ id });

    } catch (err) {
        console.error('Error editing blog:', err);
        return res.status(500).json({ error: 'Failed to edit blog post.' });
    }
})

server.post('/get-blog', async (req, res) => {
    const { blog_id, draft, mode } = req.body;
    const incrementVal = mode !== 'edit' ? 1 : 0

    if (typeof blog_id !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    try {
        const blog = await Blog.findOneAndUpdate(
            { blog_id },
            { $inc: { 'activity.total_reads': incrementVal } },
            { new: true }
        )
            .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
            .select('title des content banner activity publishedAt blog_id tags draft author');

        if (!blog) {
            return res.status(404).json({ error: 'Blog not found.' });
        }

        // 🛑 Prevent access to drafts unless requested explicitly
        if (blog.draft && !draft) {
            return res.status(403).json({ error: 'You cannot access a draft blog.' });
        }

        // ✅ Update total_reads for the author
        await User.findOneAndUpdate(
            { 'personal_info.username': blog.author.personal_info.username },
            { $inc: { 'account_info.total_reads': incrementVal } }
        );

        return res.status(200).json({ blog });

    } catch (err) {
        console.error('Error fetching blog:', err);
        return res.status(err.code || 500).json({ error: err.message || 'Something went wrong.' });
    }
})

server.post('/like-blog', verifyJWT, async (req, res) => {
    const user_id = req.user;
    const { _id, isLikedByUser } = req.body

    if (typeof isLikedByUser !== 'boolean') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    const incrementVal = isLikedByUser ? -1 : 1;

    try {
        const blog = await Blog.findOneAndUpdate(
            { _id },
            { $inc: { "activity.total_likes": incrementVal } },
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({ error: "Blog not found." });
        }

        if (!isLikedByUser) {
            // Add new like notification
            const likeNotification = new Notification({
                type: 'like',
                blog: _id,
                notification_for: blog.author,
                user: user_id,
            });

            await likeNotification.save();
            return res.status(200).json({ liked_by_user: true });

        } else {
            // Remove existing like notification
            await Notification.findOneAndDelete({
                user: user_id,
                blog: _id,
                type: 'like'
            });

            return res.status(200).json({ liked_by_user: false });
        }

    } catch (err) {
        console.error('Error liking blog:', err);
        return res.status(err.code || 500).json({ error: err.message || 'Something went wrong.' });
    }
})

server.post('/is-liked-by-user', verifyJWT, async (req, res) => {
    const user_id = req.user;
    const { _id } = req.body

    if (typeof _id !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    try {
        const isLiked = await Notification.exists({
            user: user_id,
            type: 'like',
            blog: _id
        });

        return res.status(200).json({ result: isLiked })
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
})

server.post("/add-comment", verifyJWT, async (req, res) => {
    const user_id = req.user;
    const { _id, comment, blog_author, replying_to } = req.body

    if (typeof comment !== 'string' || typeof blog_author !== 'string' || typeof _id !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    try {
        if (!comment?.trim().length) {
            return res.status(400).json({ error: 'Write something to leave a comment.' })
        }

        const isReply = Boolean(replying_to);
        const commentData = {
            blog_id: _id,
            blog_author,
            comment,
            commented_by: user_id,
            isReply,
            ...(isReply && { parent: replying_to })
        };

        const commentDoc = await new Comment(commentData).save();
        const { commentedAt, children } = commentDoc;

        // Update blog's comment array and activity counts
        await Blog.findOneAndUpdate(
            { _id },
            {
                $push: { comments: commentDoc._id },
                $inc: {
                    "activity.total_comments": 1,
                    "activity.total_parent_comments": isReply ? 0 : 1
                }
            }
        );

        // If it's a reply, also update the parent comment's children array
        let notifyUser = blog_author;
        if (isReply) {
            const parentComment = await Comment.findByIdAndUpdate(
                replying_to,
                { $push: { children: commentDoc._id } },
                { new: true }
            );
            if (parentComment) {
                notifyUser = parentComment.commented_by;
            }
        }

        const notification = new Notification({
            type: isReply ? "reply" : "comment",
            blog: _id,
            notification_for: notifyUser,
            user: user_id,
            comment: commentDoc._id,
            ...(isReply && { replied_on_comment: replying_to })
        });

        await notification.save();

        return res.status(200).json(commentDoc);

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
})

server.post('/get-blog-comments', async (req, res) => {
    const { blog_id, skip = 0, replyingTo } = req.body;
    const maxLimit = 5

    if (typeof blog_id !== 'string' || !is_number(skip)) {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    if (replyingTo && typeof replyingTo !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid value.' })
    }

    try {
        const query = replyingTo
            ? { blog_id, isReply: true, parent: replyingTo }
            : { blog_id, isReply: false };

        const comments = await Comment.find(query)
            .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
            .sort({ commentedAt: -1 })
            .skip(Number(skip))
            .limit(maxLimit);

        return res.status(200).json(comments);

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
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

        await Comment.findOne({ _id })
            .then(async (cmt) => {
                if (user_id === cmt.commented_by.toString() || user_id === cmt.blog_author.toString()) {
                    await deleteComment(_id)

                    return res.status(200).json({ status: 'Done' })
                }
                else {
                    return res.status(401).json({ error: 'You cannot delete this comment.' })
                }
            })
    }
    catch (err) {
        return res.status(err.code || 500).json({ error: err.message })
    }
})

// TODO: Implement forgot password on user login page, an email needs to be sent to the user to verify if the account holder is sending the change password request.
// DONE: currentPassword and newPassword should not be the same
server.post('/change-password', verifyJWT, async (req, res) => {
    const user_id = req.user;
    const { currentPassword, newPassword } = req.body;

    try {
        // Validate passwords
        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error: 'Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letter'
            });
        }

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'Please provide a valid password' })
        }

        if (currentPassword.trim().toLowerCase() === newPassword.trim().toLowerCase()) {
            return res.status(400).json({ error: 'Password cannot be the same' })
        }

        // Fetch user
        const user = await User.findOne({ _id: user_id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Block Google-authenticated users
        if (user.google_auth) {
            return res.status(401).json({
                error: 'You cannot reset password as you are logged in with Google.'
            });
        }

        // Compare current password
        const isMatch = await bcrypt.compare(currentPassword, user.personal_info.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Compare new password: New password cannot equal to current password
        const isNewPasswordMatch = await bcrypt.compare(newPassword, user.personal_info.password);
        if (isNewPasswordMatch) {
            return res.status(400).json({ error: 'New password cannot equal to the current password.' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne(
            { _id: user_id },
            { "personal_info.password": hashedPassword }
        );

        return res.status(200).json({ status: "Password changed." });

    } catch (err) {
        return res.status(err.code || 500).json({ error: err.message });
    }
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})