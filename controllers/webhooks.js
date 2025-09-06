import Stripe from "stripe";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";
import { response } from "express";

export const stripeWebhook = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);


    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })
                const session = sessionList.data[0];
                const { transactionId, appId } = session.metadata;

                if (appId === 'quickgpt') {
                    const transaction = await Transaction.findOne({
                        _id: transactionId, isPaid: false
                    })

                    // update credit in user account
                    await User.updateOne({ _id: transaction.userId }, {
                        $inc: {
                            credits: transaction.credits
                        }
                    })

                    // update credit payment status

                    transaction.isPaid = true;
                    await transaction.save();



                } else {
                    return response.json({
                        received: true, message: "ignored event: Invalid app"
                    })
                } break;
            }



            default:
                console.log("unhandeled event type", event.type);

                break;
        }
        res.json({received: true})
    } catch (error) {
        console.log("webhook processing error", error);
        
        res.status(500).send("Internal server error")

    }
}