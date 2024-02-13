const Profile = require("../models/Profile")
const User = require("../models/User")
const {uploadImageToCloudinary} = require("../utils/imageUploader")

// updating a profile
exports.updateProfile = async (req,res)=>{
    try {
        // get data
        const {dateOfBirth="", about="", contactNumber="", gender="", firstName, lastName} = req.body

        // get userId
        const id = req.user.id

        // validation
        if(!contactNumber || !gender){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        
        // find profile
        const userDetails = await User.findById(id)
        const profileId = userDetails.additionalDetails
        const profileDetails = await Profile.findById(profileId)

        // update profile
        profileDetails.dateOfBirth = dateOfBirth
        profileDetails.about = about
        profileDetails.contactNumber = contactNumber
        profileDetails.gender = gender
        await profileDetails.save()

        // return response
        return res.status(200).json({
            success: true,
            message: "Profile details updated successfully",
            profileDetails
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An error occurred while trying to update your profile",
            error: error.message
        })
    }
}

// delete the account
exports.deleteAccount = async (req,res)=>{
    try {
        // get id
        const id = req.user.id

        // validation
        const userDetails = await User.findById(id) 
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // profile delete
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails})
        // TODO: unenroll user from all enrolled courses

        // user delete
        await User.findByIdAndDelete({_id: id})
        
        // return response
        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User cannot be deleted successfully",
            error: error.message
        })
    }
}

exports.getAllUserDetails = async (req,res)=>{
    try {
        // get id
        const id = req.user.id

        // validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            userDetails
        }) 
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User details cannot be fetched successfully",
            error: error.message
        })
    }
}

//updateDisplayPicture
exports.updateDisplayPicture = async (req, res) => {
    try{
        const Picture = req.files.Picture;
        const userId = req.user.id;
        const image = await uploadImageToCloudinary(
        	Picture,
        	process.env.FOLDER_NAME,
            1000,
            1000
        );

        const updatedProfile = await User.findByIdAndUpdate({_id:userId},{image:image.secure_url},{ new: true });

        res.status(200).json({
                success: true,
                message: "Image updated successfully",
                data: updatedProfile,
        });
    }
	// try {

	// 	const id = req.user.id;
	//     const user = await User.findById({_id:id});
	//     if (!user) {
	// 	return res.status(404).json({
    //         success: false,
    //         message: "User not found",
    //     });
	// }
	// const image = req.files.image;
	// if (!image) {
	// 	return res.status(404).json({
    //         success: false,
    //         message: "Image not found",
    //     });
    // }
	// const uploadDetails = await uploadImageToCloudinary(
	// 	image,
	// 	process.env.FOLDER_NAME
	// );
	// console.log(uploadDetails);

	// const updatedImage = await User.findByIdAndUpdate({_id:id},{image:uploadDetails.secure_url},{ new: true });

    // res.status(200).json({
    //     success: true,
    //     message: "Image updated successfully",
    //     data: updatedImage,
    // });
		
	// } 
    catch (error) {
		return res.status(500).json({
            success: false,
            message: error.message,
        });
		
	}
}