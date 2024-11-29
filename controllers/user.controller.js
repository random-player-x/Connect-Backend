import { prisma } from "../prisma/prisma.js"
import bcrypt from 'bcrypt';
import { generateAccessToken,generateRefreshToken } from "../utils/jwt.js";
import { handleDelete, UploadOnSupabase } from "../utils/upload.utils.js";

// Scheduling Function to set the dailyActiveHour of All User to zero 
export const scheduleAtMidnight = async () => {

    console.log("Scheduling at midnight");
    
    const users = await prisma.user.findMany();

    if (!users) {
        return;
    }

    

    for (let user of users) {

        console.log(user);
        
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                totalActiveHours: user.dailyActiveHours > 0 ? user.totalActiveHours + user.dailyActiveHours : user.totalActiveHours,
                totalActiveDays: user.dailyActiveHours > 0 ? user.totalActiveDays + 1 : user.totalActiveDays,
                dailyActiveHours: 0
            }
        });

        if (!updatedUser) {
            console.log(`Error while updating user ${user.id}`);
        }
    }
}


// remember to store it in db otherwise it will get again start from this value when server restarts & will give prisma error due to unique constraint
let currentUID = 10000000; 


// Function to generate UID
function generateUID() {
    currentUID++;
    return `U${currentUID}`;
}

// Controller For Siging-up user
export const createUser = async (req, res) => {
   
    

    const { name, email, password, mobile } = req.body;


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
    
    const id = generateUID();

    try {
        const newUser = await prisma.user.create({
            data: {
                id,
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

// Controller For Login user
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

// Controller For Getting User with token
export const getUser = async (req, res) => {

    const id = req.id;


    if (!id) {
        return res.status(400).json({ error: "UserId  not decoded" });
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

// Controller For Updating User with token
export const updateUser = async (req, res) => {
    const id = req.id;
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


    const hashedPassword = password && await bcrypt.hash(password, 10);


    const newData = {
        name: name || existingUser.name,
        email: email || existingUser.email,
        password: hashedPassword || existingUser.password,
        mobile: mobile || existingUser.mobile,
        age: age || existingUser.age,
        gender: gender || existingUser.gender,
        location: location || existingUser.location,
        parentName: parentName || existingUser.parentName,

    }


    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: newData
        });
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

// Controller For Uploading Media with token
export const uploadMedia = async (req, res) => {

    const id = req.id;
    const { type } = req.params;
    const filePath = req.file?.path;


    if (!type || !filePath || !id) {
        return res.status(400).json({ error: "Media Type and Media Url are required" });
    }

    if (type !== "image" && type !== "video") {
        return res.status(400).json({ error: "Invalid Media Type" });
    }

    const field = `${type}Url`;

    try {


        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const url = await UploadOnSupabase(filePath, 'User', id, type);

        if (!url) {
            return res.status(400).json({ error: "Media not uploaded" });
        }




        if (user[field] && user[field].includes(url)) {
            return res.status(400).json({ error: "File already exists" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                [field]: {
                    push: url
                }
            }
        });


        if (!updatedUser) {
            return res.status(400).json({ error: "Error While Updating the user" });
        }



        res.status(201).json({ updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }


}

// Controller For Getting Media Url with token
export const getMediaUrl = async (req, res) => {
    const id = req.id;
    const { type } = req.params;

    if (type !== "image" && type !== "video") {
        return res.status(400).json({ error: "Invalid Media Type" });
    }

    if (!id) {
        return res.status(400).json({ error: "User Id is required" });
    }

    const field = `${type}Url`;

    try {
        const getTypeUrl = await prisma.user.findUnique({
            where: { id },
            select: { [field]: true }
        });

        if (!getTypeUrl) {
            return res.status(400).json({ error: "No url found" });
        }

        const urls = getTypeUrl[field];
        if (urls.length === 0) {
            return res.status(404).json({ error: "No url Found" })
        }

        res.status(200).json(urls);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

// Controller For Deleting Media Url with token
export const deleteMediaUrl = async (req, res) => {

    const id = req.id;
    const { type } = req.params;
    const { url } = req.body;

    if (type !== "image" && type !== "video") {
        return res.status(400).json({ error: "Invalid Media Type" });
    }

    if (!id || !url) {
        return res.status(400).json({ error: "User Id and Media Url are required" });
    }

    const field = `${type}Url`;

    try {

        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                [field]: {
                    set: user[field].filter((media) => media !== url)
                }
            }
        });

        if (!updatedUser) {
            return res.status(400).json({ error: "Error While Updating the user" });
        }


        const deleteinBucket = await handleDelete(url, 'User', id, type);

        if (!deleteinBucket) {
            return res.status(400).json({ error: "Error While Deleting the media" });
        }

        res.status(200).json({ updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }
}

// Controller For Updating daily Active Hours with token
export const updatedailyActiveHours = async (req, res) => {

    const id = req.id;
    const { dailyActiveHours } = req.body;

    if (!dailyActiveHours || dailyActiveHours < 0 || dailyActiveHours > 24) {
        return res.status(400).json({ error: "Daily Active Hours are required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                dailyActiveHours:  user.dailyActiveHours + dailyActiveHours
            }
        });

        res.status(200).json({ user: updatedUser.dailyActiveHours });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
    }


}