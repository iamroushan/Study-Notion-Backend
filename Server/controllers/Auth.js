const User= require("../models/User")
const OTP= require("../models/OTP")
const otpGenerator= require("otp-generator")
const bcrypt= require("bcrypt")
const jwt = require("jsonwebtoken")
const mailSender = require("../utils/mailSender")
require("dotenv").config()
const Profile = require("../models/Profile")


// sentOTP
exports.sendOTP= async(req,res)=>{
    try {
        // fetch email from request body
        const {email}= req.body;
    
        // check if user already exist
        const checkUserPresent= await User.findOne({email})
    
        // if user already exist , then return a resposne
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already registered"
            })
        }
    
        // generate otp
        var otp= otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        })
        console.log("OTP generated: ",otp);

        // check uniqure otp or not
        let result= await OTP.findOne({otp: otp})

        while(result){
            otp= otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })

            result= await OTP.findOne({otp: otp})
        }

        const otpPayload= {email, otp}

        // create an entry in db
        const otpBody= await OTP.create(otpPayload)
        console.log(otpBody);

        // return response successfull
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp
        })

    } catch (error) {
        console.log("OTP not generated",error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// signUp
exports.signUp= async(req,res)=>{
    try {
        // fetch data from body request
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        }= req.body
    
    
        // validate karlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }
    
    
        // match 2 passwords
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and cofirmPassword does not match, please try again"
            })
        }
    
        // check user already exist or not
        const existingUser= await User.findOne({email:email})
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User is already registered"
            })
        }

        console.log("the user is : " , existingUser);
    
        // find most recent otp for the user
        const recentOtp= await OTP.find({email}).sort({createdAt: -1}).limit(1)
        console.log('the otp : ',otp );
        console.log('the recent opts : ' , recentOtp , recentOtp[0].otp);
    
        // validate otp
        if(recentOtp[0].length == 0){
            // OTP not found
            return res.status(400).json({
                success: false,
                message: "OTP not found"
            })
        }
        else if(otp !== recentOtp[0].otp){
            // Invalid OTP
            return res.status(400).json({
                success: false,
                message:"OTP is invalid"
            })
        }
    
        // hash password
        const hashedPassword= await bcrypt.hash(password,10)
    
        // create entry in db
    
        const profileDetails= await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        })
        const user= await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })
    
        // return res
        return res.status(200).json({
            success: true,
            message: "User is registered successfully",
            user
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User not registered. Please try again"
        })
    }
}

// login
exports.login =async (req,res)=>{
    try{
        // get data from req body
        const {email,password}=req.body

        // validation of data
        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "All fields are required, please try again"
            }) 
        }

        // check user exist or not
        const user= await User.findOne({email}).populate("additionalDetails")
        if(!user){
            return res.status(401).json({
                success: false,
                message:"User is not registered , please signup first"
            })
        }

        // generate JWT, after password matching
        if (await bcrypt.compare(password, user.password)){

            const token = jwt.sign(
                {email: user.email,
                    id: user._id,
                    accountType: user.accountType
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h"
                }
            )
            user.token = token
            user.password= undefined

            // create cookie and send response
            const options= {
                expires: new Date(Date.now()+ 3*24*60*60*1000),
                httpOnly: true
            }
            res.cookie("token",token, options).status(200).json({
                success: true,
                message: "Logged in successfully",
                token,
                user
            })
        }
        else{
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: "Login failure, please try again later."
        })
    }
}

// controller for changePassword
// TODO: homework
exports.changePassword= async(req,res)=>{
    try {
        // get data from req body
        const userDetails = await User.findById(req.user.id);
    
        // get oldPassword, newPassword, confirmNewPassword
        const {oldPassword, newPassword, confirmNewPassword} = req.body
    
        // validation of old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        )
    
        if(oldPassword === newPassword){
            return res.status(400).json({
                success: false,
                message: "New password cannot be same as old password"
            })
        }
    
        if(!isPasswordMatch){
            return res.status(401).json({
                success: false,
                message: "The password is incorrect"
            })
        }
    
        // Match new password and confirm new password
        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success: false,
                message: "The password and confirm new pasword does not match"
            })
        }
    
        // update pwd in db
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            {password: encryptedPassword},
            {new: true}
        )
    
        // send notification mail - password updated
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Study Notion - Password Updated",
                passwordUpated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email Sent Successfully: ",emailResponse.response);
        } 
        catch (error) {
            console.error("Error occurred while sending email: ",error)
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message
            })
        }
    
        // return success response
        return res.status(200).json({
            success: true,
            message: "Password Updated Successfully"
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message
        })
    }
}