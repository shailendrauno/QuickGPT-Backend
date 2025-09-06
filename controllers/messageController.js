import axios from "axios"
import Chat from "../models/chat.js"
import User from "../models/user.js"
import imagekit from "../configs/imageKit.js"
import openai from "../configs/openai.js"



// text based AI chat message 


export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        // check credit
        if (req.user.credits < 1) {
            return res.json({ success: false, message: "You don't have enough credits to use feature" })
        }
        const { chatId, prompt } = req.body
        const chat = await Chat.findOne({ userId, _id: chatId })
        chat.messages.push({ role: "user", content: prompt, timestamp: Date.now(), isImage: false })

        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [

                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = { ...choices[0].message, timestamp: Date.now(), isImage: false }
        res.json({ success: true, reply })
        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } })



    } catch (error) {
        res.json({ success: false, message: error.message })

    }
}

// image genration message controller

export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        // check credit
        if (req.user.credits < 2) {
            return res.json({ success: true, message: "You don't have enough credits to use feature" })
        }
        const { prompt, chatId, isPublised } = req.body
        // find chat
        const chat = await Chat.findOne({ userId, _id: chatId })

        // Push user message
        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        })

        // encode the prompt

        const encodedPrompt = encodeURIComponent(prompt)

        // counstruct imageki ai genration url
        const genratedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/${Date.now()}.png?tr=w-800,h-800`

        // trigger genration by fetching the imagekit

        const aiImageResponse = await axios.get(genratedImageUrl, { responseType: 'arraybuffer' })


        // convert image to base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, 'binary').toString('base64')}`

        //upload image to imagekit

        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })


        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublised
        }
        res.json({ success: true, reply })

        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } })


    } catch (error) {
        res.json({ success: false, message: error.message })

    }

} 