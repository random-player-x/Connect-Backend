import { prisma } from '../prisma/client.js';
const jwt = require('jsonwebtoken');

// Utility function for validation
const validateFields = (fields, res) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) {
            res.status(400).json({ error: `${key} is required` });
            return false;
        }
    }
    return true;
};

// Function to generate custom Avatar ID
const generateAvatarId = async () => {
    const lastCounter = await prisma.idCounter.upsert({
        where: { model: 'Avatar' },
        update: { lastId: { increment: 1 } },
        create: { model: 'Avatar', lastId: 1000000 },
    });
    return `A${(lastCounter.lastId).toString().padStart(8, '0')}`;
};

// Avatar Signup
export const AvatarSignup = async (req, res) => {
    const { name, mobile, password } = req.body;

    // Validate required fields
    if (!validateFields({ name, mobile, password }, res)) return;

    try {
        const existingAvatar = await prisma.avatar.findUnique({
            where: { mobile },
        });

        if (existingAvatar) {
            return res.status(409).json({ error: 'Avatar already exists' });
        }
        const token = jwt.sign({ mobile }, process.env.JWT_SECRET);

        const id = await generateAvatarId();
        const newAvatar = await prisma.avatar.create({
            data: {
                id,
                name,
                mobile,
                password,
            },
        });

        res.status(201).json({
            message: 'Avatar created successfully',
            avatar: {
                id: newAvatar.id,
                name: newAvatar.name,
                mobile: newAvatar.mobile,
            },
            token : token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating avatar' });
    }
};

// Avatar Login
export const AvatarLogin = async (req, res) => {
    const { mobile, password } = req.body;

    // Validate required fields
    if (!validateFields({ mobile, password }, res)) return;

    try {
        const avatar = await prisma.avatar.findUnique({
            where: { mobile },
        });

        if (!avatar) {
            return res.status(404).json({ error: 'Avatar does not exist' });
        }

        if (avatar.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jwt.sign({ mobile }, process.env.JWT_SECRET);

        res.status(200).json({
            message: 'Avatar logged in successfully',
            avatar: {
                id: avatar.id,
                name: avatar.name,
                mobile: avatar.mobile,
            },
            token : token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in avatar' });
    }
};

// Avatar Registration
export const AvatarRegistration = async (req, res) => {
    const { id, email, profileImage } = req.body;

    // Validate required fields
    if (!validateFields({ id, email, profileImage }, res)) return;

    try {
        const existingAvatar = await prisma.avatar.findUnique({
            where: { id },
        });

        if (!existingAvatar) {
            return res.status(404).json({ error: 'Avatar does not exist' });
        }

        const updatedAvatar = await prisma.avatar.update({
            where: { id },
            data: { email, profileImage },
        });

        res.status(200).json({
            message: 'Avatar registered successfully',
            avatar: {
                id: updatedAvatar.id,
                email: updatedAvatar.email,
                profileImage: updatedAvatar.profileImage,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering avatar' });
    }
};

const getAvatar = async (res,req) => {
    const avatarID = req.params.id;
    try {
        const avatar = await prisma.avatar.findUnique({
            where: { id: avatarID },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                profileImage: true,
                type:true,
            },
        });

        if (!avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }

        res.status(200).json({ avatar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching avatar' });
    }
}