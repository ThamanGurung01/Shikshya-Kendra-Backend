import { Types } from 'mongoose';
import {z,ZodError} from 'zod';
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
    owner_id: z.instanceof(Types.ObjectId),
    documents:z.object({
        panCertificate:z.object({
            type:z.string().min(3,"PAN certificate type must be at least 3 characters long"),
            value:z.string().min(3,"PAN certificate value must be at least 3 characters long")
        }),
        registrationCertificate:z.string().min(3,"Registration certificate must be at least 3 characters long"),
    }).optional().refine(v=>v!==undefined),
    verifiedAt:z.date().optional().refine(v=>v!==undefined)
})

export const schoolCreate=SchoolSchema.extend(userSchema.shape);
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}
export type ISchoolInput=z.infer<typeof SchoolSchema>;