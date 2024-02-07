const Section = require("../models/Section")
const Course = require("../models/Course")

// create section handler function
exports.createSection = async (req,res)=>{
    try {
        // data fetch from req body
        const {sectionName, courseId}= req.body

        // data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // create section
        const newSection = await Section.create({sectionName})

        // update course with section objectID
        const updatedCourseDetails = await Course.findOneAndUpdate(courseId,
            {
                $push: {
                    courseContent : newSection._id,
                }
            },
                {new: true},//return the new value not the old one
            )
            // TODO: use populate to replace sections/subSections both in the updatedCourseDetails
            .populate({
                path: courseContent,
                populate:{
                    path: "subSection"
                }
            }).exec()

        // return response
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create section please try again",
            error: error.message,
        })
    }
}

// update section handler function
exports.updatedSection = async (req,res)=>{
    try {
        // get data input
        const {sectionName, sectionId} = req.body

        // data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new: true})

        // return response
        return res.status(200).json({
            success: true,
            message: "Section updated successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update section, please try again",
            error: error.message
        })
    }
}


// delete section handler function
exports.deleteSection = async (req,res)=>{
    try {
        // get ID -> assuming that we are sending ID in parameters(params)
        const {sectionId} = req.params

        // use findByIdAndDelete
        await Section.findByIdAndDelete(sectionId)

        // return response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully"
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete section, please try again",
            error: error.message
        })
    }
}