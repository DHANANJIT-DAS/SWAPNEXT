import Joi from 'joi';

// This schema only cares about the data sent during signup

const signupSchema = Joi.object({
    fullName: Joi.string()
        .min(1)
        .max(50)
        .trim()
        .required()
        .messages({
            "string.empty": "Fullname is required",
            "string.min": "Fullname should be at least 1 characters"
        }),

    email: Joi.string()
        .email()
        .trim()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Please provide a valid email address"
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters long"
        })
});



const loginSchema = Joi.object({

    email: Joi.string()
        .email()
        .trim()
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Please provide a valid email address"
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters long"
        })
});



export {signupSchema,loginSchema};