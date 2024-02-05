const User= require("../models/User")
const mailSender = require("../utils/mailSender")


// resetPasswordToken
exports.resetPasswordToken = async(req,res)=>{
    try {
        // get email from req body
        const email= req.body.email
    
        // check user from this email, email validation
        const user= await User.findOne({email: email})
        if(!user){
            return res.json({
                success: false,
                message: "Your Email is not registered with us"
            })
        }
    
        // generate token
        const token = crypto.randomUUID()
    
        // update user by adding token and expiration time
        const updatedDetails= await User.findOneAndUpdate({email: email},{
            token: token,
            resetPasswordExpires: Date.now() + 5*60*1000,
        },{new: true}) 
    
        // create url
        const url = `http://localhost:3000/update-password/${token}`
    
        // send email containing the url
        await mailSender(email,
            "Password Reset Link",
            `Passwrod Reset Link: ${url}`
        )
    
        // return response
        return res.json({
            success: true,
            message: "Email sent successfully"
        })
    } 
    catch (error) {
        console.log(error);
        return res.statu(500).json({
            success: false,
            message: "Something went wrong while sending reset password mail"
        })
    }

}


// resetPassword