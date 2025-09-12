import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from '../config/environment';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        if (decoded.role !== "admin") {
            res.status(403).json({ error: "Not an admin" });
            return;
        }

        req.admin = { id: decoded.id };
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid token" });
    }
};
