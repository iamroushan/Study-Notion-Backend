const SubSection = require("../models/SubSection")
const Section = require("../models/Section")
const {uploadImageToCloudinary} = require("../utils/imageUploader")
const Course = require("../models/Course")

// create SubSection
exports.createSubSection = async (req,res)=>{
    try {
        // fetch data from Req body
        const {sectionId, title, timeDuration, description, courseId} = req.body

        // extract file/video
        const video = req.files.videoFile

        // validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
        console.log("upload details is: ",uploadDetails);

        // create a subsection
        const subSectionDetails = await SubSection.create({
            title: title,
            //timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url
        })

        // update section with this subSection ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id: sectionId},
            {
                $push:{
                    subSection: subSectionDetails._id
                }
            },{new: true}).populate("subSection")
        // TODO: log updatedSection here, after adding populate query
        const updatedCourse = await Course.findById(courseId).populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        }).exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub Section created successfully",
            updatedSection
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

// TODO: updateSubSection
exports.updateSubSection = async (req,res)=>{
    try {
        // fetch data from request body
        const {subSectionId, title, description, courseId} = req.body

        // extract file/video
        const video = req?.files?.videoFile

        // validation
        if(!subSectionId || !title || !description || !courseId){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // upload video to cloudinary
        let uploadDetails = null
        if(video){
            uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME)
        }

        // Create a new sub-section with the necessary information
        const subSectionDetails = await SubSection.findByIdAndUpdate({_id: subSectionId},{
            title: title || SubSection.title,
            description: description || SubSection.description,
            videoUrl: uploadDetails?.secure_url || SubSection.videoUrl
        },{new: true})

        const updatedCourse = await Course.findById(courseId).populate(
            {
                path:"courseContent",
                populate:{
                    path: "subSection"
                }
            }
        ).exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub Section updated successfully",
            updatedCourse
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred during the updating of the sub section",
            error: error.message
        })
    }
}

// TODO: deleteSubSection
exports.deleteSubSection = async (req,res)=>{
    try {
        // fetch data from request body
        const {subSectionId, courseId} = req.body
        const sectionId = req.body.sectionId

        // validation
        if(!subSectionId || !courseId){
            return res.status(404).json({
                success: false,
                message: "All fields are required"
            })
        }

        const ifSubSection = await SubSection.findById({_id: subSectionId})
        const ifSection = await Section.findById({_id: sectionId})

        // validation of subSection
        if(!ifSubSection){
            return res.status(404).json({
                success: false,
                message: "Sub Section not found"
            })
        }

        // validation of Section
        if(!ifSection){
            return res.status(404).json({
                success: false,
                message: "Section not found"
            })
        }

        await SubSection.findByIdAndDelete(subSectionId)
        await Section.findByIdAndUpdate({_id: sectionId},{
            $pull: {
                subSection: subSectionId
            }
        },{new: true})

        const updatedCourse = await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path: "subSection"
            }
        }).exec()

        // return response
        return res.staus(200).json({
            success: true,
            message: "Deleted the Sub Section Successfully!",
            updatedCourse
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred during the deleting the sub section",
            error: error.message
        })
    }
}