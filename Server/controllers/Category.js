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
        const allCategories = await Category.find({},{name: true, description: true})
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

// categoryPageDetails handler function
exports.categoryPageDetails = async (req,res)=>{
    try {
        // get categoryId
        const {categoryId} = req.body

        // get courses for specified categoryId
        const selectedCategory = await Category.findById(categoryId).populate("courses").exec()

        // validation
        if(!selectedCategory){
            return res.status(404).json({
                success: false,
                message: "Data not found"
            })
        }

        // get courses for different categories
        const differentCategories = await Category.find({
            _id: {$ne: categoryId}  // ne-> not equal
        })
        .populate("courses")
        .exec()

        // TODO: get top 10 Selling courses
        const allCategories = await Category.find().populate(
            {
                path: "courses",
                match: {status: "Published"},
                populate:([
                    {path: "instructor"},
                    {path: "ratingAndReviews"}
                ])
            }
        )

        const allCourses = allCategories.flatMap((category) => category.courses)

        const mostSellingCourses = allCourses
            .sort((a,b)=> b.sold - a.sold)
            .slice(0,10)

        // return response
        return res.status(200).json({
            success: true,
            data:{
                selectedCategory,
                differentCategories,
                mostSellingCourses
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}