import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// genrate JWT token

const genrateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "10d",
    })
}

// API to register a new user

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.json({ success: false, message: "User already exists" });
        }
        const user = await User.create({ name, email, password });
        const token = genrateToken(user._id)
        res.json({success: true, token})
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};




// API to login user

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if(user){
            const isMatch = await bcrypt.compare(password, user.password);
            if(isMatch){
                const token = genrateToken(user._id)
                return res.json({ success: true, token });
            }
        }

        return res.json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}


// API to get user details

export const getUser = async (req, res) => {
    try {
        const user = req.user;
        res.json({ success: true, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}


// api to get published images

export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            {$unwind: "$messages"},
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName",
                    
                }
            },
        ])


        res.json({ success: true, Images: publishedImageMessages.reverse() });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}