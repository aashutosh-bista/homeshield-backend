import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middleware/error.middleware.js";



//For express app

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))

//configuration
// limit of request body
app.use(express.json({limit: "16kb"}))
//for url encoded data
app.use(express.urlencoded({extended: true,limit: "16kb"}))
//for public folder
app.use(express.static("public"))

//for cookie parser
app.use(cookieParser())

//Routes

import userRouter from "./routes/user.routes.js";

/* import bookingRouter from "./routes/booking.routes.js";*/
import contactRouter from "./routes/contact.routes.js"; 
import blogRouter from "./routes/blog.routes.js";
import serviceCategoryRouter from "./routes/serviceCategory.routes.js";
import serviceRouter from "./routes/service.routes.js";
import faqRouter from "./routes/faq.routes.js";
import aboutRouter from "./routes/about.routes.js";
import serviceAreaRouter from "./routes/serviceArea.routes.js";
import settingRoutes from "./routes/setting.routes.js";

//routes declaration
app.use("/api/v1/settings", settingRoutes);
app.use("/api/v1/contact", contactRouter); 
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/service-categories", serviceCategoryRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/faqs", faqRouter);
app.use("/api/v1/about", aboutRouter);
app.use("/api/v1/service-areas", serviceAreaRouter);
/* app.use("/api/v1/bookings", bookingRouter); */

//for handling not found routes


app.use(errorHandler);
export {app}