require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
// body-parser는 express 내장형으로 대체 가능합니다. 따라서 별도로 body-parser를 사용할 필요가 없습니다.

const app = express();
app.use(express.json()); // express 내장 미들웨어를 사용하여 JSON 요청 본문을 파싱합니다.
const port = 5001;
const mongoDBURI = process.env.MONGODB_URL;

mongoose
    .connect(mongoDBURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    nickname: String,
    password: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
});

const Post = mongoose.model('Post', postSchema);

// 글 목록 불러오기
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find({ deletedAt: null });
    res.send(posts);
});

// 글 상세 불러오기
app.get('/api/post/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).send({ message: '게시글을 찾을 수 없습니다.' });
        }
        res.send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});

// 글 쓰기
app.post('/api/post', async (req, res) => {
    const { title, content, nickname, password } = req.body; // 요청 본문에서 데이터를 추출합니다.

    try {
        const post = new Post({
            title,
            content,
            nickname,
            password,
            createdAt: new Date(),
        });
        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
});

// 글 수정 전에 패스워드 확인
app.post('/api/post/:id/verify-password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).send({ messge: '패스워드를 찾을 수 없습니다.' });
        }
        if (post.password === password) {
            res.send({ messge: '패스워드 확인 완료' });
        }
    } catch (error) {
        res.status(401).send({ messge: '패스워드어쩌구~' });
    }
});

// 글 수정

app.put('/api/post/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, nickname } = req.body;

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { title, content, nickname, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).send({ messge: '게시글을 찾을 수 없습니다.' });
        }
        res.send(updatedPost);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/api/post/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const post = await Post.findById(id);

        if (!post) {
            res.status(404).send({ messge: '게시글 없음' });
        }

        if (post.password === password) {
            await Post.findByIdAndUpdate(id, { deletedAt: new Date() });
            res.send({ messge: '삭제 성공!' });
        }
    } catch (error) {
        res.send(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
