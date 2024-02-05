const User= require("../models/User")
const OTP= require("../models/OTP")
const otpGenerator= require("otp-generator")
const bcrypt= require("bcrypt")


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
        const existingUser= await User.findOne({email})
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User is already registered"
            })
        }
    
        // find most recent otp for the user
        const recentOtp= await OTP.find({email}).sort({createdAt: -1}).limit(1)
        console.log(recentOtp);
    
        // validate otp
        if(recentOtp.length == 0){
            // OTP not found
            return res.status(400).json({
                success: false,
                message: "OTP not found"
            })
        }
        else if(otp !== recentOtp.otp){
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
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}`,
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

// changePassword