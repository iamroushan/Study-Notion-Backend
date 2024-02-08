const Course= require("../models/Course")
const Category= require("../models/Category")
const User = require("../models/User")
const {uploadImageToCloudinary} = require("../utils/imageUploader")


// createCourse handler function
exports.createCourse = async (req,res)=>{
    try {
        // fetch data 
        const {courseName, courseDescription, whatYouWillLearn, price, tag, category} = req.body

        // Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage

        // validation -> Check if any of the required fields are missing
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
            return res.status(400).json({
                success: false,
                message: "All fileds are required"
            })
        }

        // Check if the user is an instructor
        const userId = req.user.id
        const instructorDetails = await User.findById(userId,{
            accountType: "Instructor"
        })
        console.log("instructor details: ",instructorDetails);
        // TODO: verify that userId and instructorDetails._id are same or different?

        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: "Instructor details not found"
            })
        }

        // check given category is valid or not
        const categoryDetails  = await Category.findById(Category)
        if(!categoryDetails ){
            return res.status(404).json({
                success: false,
                message: "Category details not found"
            })
        }

        // Upload the Thumbnail to Cloudinary   
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME)

        // create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url
        })

        // add the new course to the user schema of instructor
        await User.findByIdAndUpdate(
            {
                _id: instructorDetails._id
            },
            {
                $push:{
                    courses: newCourse._id,
                }
            },
            {new:true}
        )
        
        // update the category schema
        // TODO: HW
        await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
		);

        // return response
        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create a course",
            error: error.message
        })
    }
}


// getAllCourses handler function
exports.showlAllCourse = async (req,res)=>{
    try {
        // TODO: change the below statement
        const allCourses = await Course.find({},
            {
                courseName: true,
				price: true,
				thumbnail: true,
				instructor: true,
				ratingAndReviews: true,
				studentsEnrolled: true,
            })
            .populate("instructor")
			.exec();
        return res.status(200).json({
            success: true,
            message: "Data for all course fetched successfully",
            data: allCourses 
        })
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot fetch course data",
            error: error.message
        })
    }
}

// getCourseDetails handler function
exports.getCourseDetails = async (req,res)=>{
    try {
        const {courseId} = req.body
        const courseDetails = await  Course.findById({_id: courseId}).populate(
            {
                path:"instructor",
                populate: {
                    path: "additionalDetails"
                }
            }
        )
        .populate("category")
        .populate({
            path: "ratingAndReviews",
            populate:{
                path:"user",
                select: "firstName lastName accountType image"
            }
        })
        .populate({
            path: "courseContent",
            populate:{
                path: "subSection"
            }
        }).exec()

        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Course details fetched successfully!",
            courseDetails
        })

    } catch (error) {
        console.log(error);
        return res.status(404).json({
            success: false,
            message: "Can't fetched Course data",
            error: error.message
        })
    }
}