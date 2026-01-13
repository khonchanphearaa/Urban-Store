export const isAdmin = (req, res, next) =>{
    if(!req.user || req.user.role !== "ADMIN"){
        return res.status(403).json({
            message: "Admin Access Only!!",
        });
    }
    next();
};