import {z} from 'zod';
import { userSchema } from './user.validator';
const SchoolSchema=z.object({
    school_name:z.string().min(3,"Name must be at least 3 characters long"),
    address:z.string().min(5,"Address must be at least 5 characters long"),
    contact:z.string().min(10,"Contact number must be at least 10 characters long"),
    school_email:z.email("Invalid email address").optional().refine(v=>v!==undefined),
    website:z.url("Invalid URL").optional().refine(v=>v!==undefined),
    map:z.string().optional().refine(v=>v!==undefined),
    city:z.string().optional().refine(v=>v!==undefined),
    country:z.string().optional().refine(v=>v!==undefined),
    documents:z.object({
        panCertificate:z.object({
            type:z.string().min(1,"PAN certificate type is required"),
            value:z.string().min(1,"PAN certificate value is required")
        }),
        registrationCertificate:z.string().min(1,"Registration certificate is required"),
    }).optional().refine(v=>v!==undefined),
    verifiedAt:z.date().optional().refine(v=>v!==undefined)
})
// Full create: school fields + required user fields

export const schoolCreate=SchoolSchema.extend(userSchema.shape);
// Update: school fields + all user fields optional
export const schoolUpdate=SchoolSchema.partial().extend({
    name:z.string().min(3,"Name must be at least 3 characters long").optional(),
    password:z.string().min(6,"Password must be at least 6 characters long").optional(),
    profileImage:z.string().optional(),
});
export type ISchoolInput=z.infer<typeof SchoolSchema>;
export type ISchoolUpdate=z.infer<typeof schoolUpdate>;