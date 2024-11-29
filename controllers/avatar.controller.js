import { UploadOnSupabase,handleDelete } from '../utils/upload.utils.js';
import { prisma } from '../prisma/prisma.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from "../utils/jwt.js";


const validateFields = (fields, res) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) {
            res.status(400).json({ error: `${key} is required` });
            return false;
        }
    }
    return true;
};

export const AvatarSignup = async (req, res) => {
    const { name, mobile, password } = req.body;

    // Validate required fields
    if (!validateFields({ name, mobile, password }, res)) return;

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                mobile: mobile
            }
        });
    
        if (existingUser) {
            return res.status(400).json({ error: "Email or mobile number already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAvatar = await prisma.avatar.create({
            data: {
                name,
                mobile,
                password: hashedPassword,
            },
        });

        if (!newAvatar) {
            return res.status(400).json({ error: "avatar not created" });
        }

        res.status(201).json({ "avatar": { ...newAvatar, token: generateAccessToken({ id: newAvatar.id }) } });

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
            return res.status(404).json({ error: 'Invalid Mobile' });
        }
        const passwordMatch = await bcrypt.compare(password, avatar.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.status(200).json({

            "token": generateAccessToken({ id: avatar.id }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
};
export const getAvatar = async (res,req) => {
    const id = req.id;
    if (!id) {
        return res.status(400).json({ error: 'Avatar ID not decoded' });
    }
    try {
        const avatar = await prisma.avatar.findUnique({
            where: { id: id },
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

export const updateAvatar = async (res,req) => {
    const id = req.id;
    const {name, mobile, password, email, profileImage } = req.body;

    if (!name && !mobile && !password && !email && !profileImage) {
        return res.status(400).json({ error: 'At least one field is required to update' });
    }

    try {
        const existingAvatar = await prisma.avatar.findUnique({
            where: { id: id },
        });

        if (!existingAvatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const updatedAvatar = await prisma.avatar.update({
            where: { id: id },
            data: {name, mobile, hashedPassword, email, profileImage },
        });

        res.status(200).json({
            message: 'Avatar updated successfully',
            updatedAvatar,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating avatar' });
    }
}

export const uploadAvatarPhoto = async (req, res) => {
    const id = req.id; 
    const { type } = req.params; 
    const filePath = req.file?.path; 

    // Validate required fields
    if (!type || !filePath || !id) {
        return res.status(400).json({ error: "Media type, file path, and user ID are required" });
    }

    try {
        // Upload the image to Supabase (or any storage solution you're using)
        const url = await UploadOnSupabase(filePath, 'Avatar', id, type);

        // Check if the upload was successful
        if (!url) {
            return res.status(400).json({ error: "Failed to upload media" });
        }

        // Update the user's avatar record in the database
        const updatedAvatar = await prisma.avatar.upsert({
            where: { id: id }, 
            update: { profileImage: url }, 
            create: { id: id, profileImage: url }, // Create a new avatar record if it doesn't exist
        });

        // Respond with the updated avatar URL
        return res.status(201).json({ imageUrl: updatedAvatar.profileImage });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getMediaUrl = async (req, res) => {
    const id = req.id;

    if (!id) {
        return res.status(400).json({ error: "User not authorized" });
    }

    try {
        const avatar = await prisma.avatar.findUnique({
            where: { id: id },
        });

        if (!avatar || !avatar.profileImage) {
            return res.status(404).json({ error: "Avatar not found" });
        }

        return res.status(200).json({ imageUrl: avatar.profileImage });
    } catch (error) {
        console.error("Error fetching avatar URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
