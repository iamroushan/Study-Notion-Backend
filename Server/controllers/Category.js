const Category= require("../models/Category")

// create category handler function
exports.createCategory= async(req,res)=>{
    try {
        // fetch data   
        const {name, description}= req.body

        // validation
        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // create entry in db
        const categoryDetails = await Category.create({
            name: name,
            description: description
        }) 
        console.log(categoryDetails);

        // return response
        return res.status(200).json({
            success: true,
            message: "Categories created successfully"
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// getAllTags handler function
exports.showAllCategories = async (req,res)=>{
    try {
        const allCategories = await Tag.find({},{name: true, description: true})
        res.status(200).json({
            succes: true,
            message: "All categories return successfully",
            allCategories
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}