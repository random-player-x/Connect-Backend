import { prisma } from "../prisma/prisma.js"
import bcrypt from 'bcrypt';
import { generateAccessToken } from "../utils/jwt.js";
import {handleUpload,getAllFileUrls} from "../utils/upload.utils.js";

const UserID = 10000000;


export const createUser = async (req, res) => {


    const { name, email, password, mobile } = req.body;

    // const id = `U${UserID+1}`;

    if (!name || !email || !password || !mobile) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { mobile: mobile }
            ]
        }
    });

    if (existingUser) {
        return res.status(400).json({ error: "Email or mobile number already exists" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                mobile
            }
        });

        if (!newUser) {
            return res.status(400).json({ error: "User not created" });
        }

        res.status(201).json({ "user": { ...newUser, token: generateAccessToken({ id: newUser.id }) } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }

}

export const loginUser = async (req, res) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).json({ error: "Mobile and password are required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { mobile: mobile }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid mobile or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid mobile or password" });
        }
       
        const token = generateAccessToken({ id: user.id });

        res.status(200).json({ token: token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

export const getUser = async (req, res) => {
    
    const id  = req.id;
    

    if(!id){
        return res.status(400).json({error: "UserId  not decoded"});
    }   

    try {
        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

export const updateUser = async (req, res) => {
    const id  = req.id;
    const { name, email, password, mobile, age, gender, location, parentId, parentName } = req.body;

    if (!name && !email && !password && !mobile && !age && !gender && !location && !parentId && !parentName) {
        return res.status(400).json({ error: "At least one field is required to update" });
    }

    const existingUser = await prisma.user.findUnique({
        where: { id: id }
    });

    if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                password: hashedPassword,
                mobile,
                age,
                gender,
                location,
                parentId,
                parentName,
            }
        });
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}


export const uploadMedia = async (req, res) => {

    const id = req.id;
    const {type} = req.params;
    const filePath =   req.file?.path;

    if (!type || !filePath || !id) {
        return res.status(400).json({ error: "Media Type and Media Url are required" });
    }

    try {

        const url = await handleUpload(filePath, 'User', id , type);

        if(!url){
            return res.status(400).json({ error: "Media not uploaded" });
        }

      

        res.status(201).json({ url});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }

    
}

export const getMediaUrl = async (req, res) => {
    const id = req.id;
    const {type} = req.params;

    if (!id) {
        return res.status(400).json({ error: "User Id is required" });
    }

    try {
        const imagesURL = await getAllFileUrls('User', id, type);

        if (!imagesURL) {
            return res.status(400).json({ error: "Images not found" });
        }

        res.status(200).json({  imagesURL });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}