import { Types } from 'mongoose';
import {z,ZodError} from 'zod';
const SchoolSchema=z.object({
    school_name:z.string().min(3,"Name must be at least 3 characters long"),
    address:z.string().min(5,"Address must be at least 5 characters long"),
    contact:z.string().min(10,"Contact number must be at least 10 characters long"),
    school_email:z.email("Invalid email address").optional().refine(v=>v!==undefined),
    website:z.url("Invalid URL").optional().refine(v=>v!==undefined),
    owner_id: z.instanceof(Types.ObjectId).optional().refine(v=>v!==undefined),
    kyc_files:z.array(z.object({
        file_name:z.string().min(3,"File name must be at least 3 characters long"),
        file_url:z.url("Invalid file URL")
    })).optional().refine(v=>v!==undefined),
    verifiedAt:z.date().optional().refine(v=>v!==undefined)
})
const userSchema=z.object({
    name:z.string().min(3,"Name must be at least 3 characters long"),
    email:z.email("Invalid email address"),
    password:z.string().min(6,"Password must be at least 6 characters long")
})
export const schoolCreate=SchoolSchema.extend(userSchema.shape);
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}
export type ISchoolInput=z.infer<typeof SchoolSchema>;