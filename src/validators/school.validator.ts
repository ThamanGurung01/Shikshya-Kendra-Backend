import { Types } from 'mongoose';
import {z,ZodError} from 'zod';
export const SchoolSchema=z.object({
    name:z.string().min(3,"Name must be at least 3 characters long"),
    address:z.string().min(5,"Address must be at least 5 characters long"),
    contact:z.string().min(10,"Contact number must be at least 10 characters long"),
    email:z.email("Invalid email address"),
    website:z.url("Invalid URL").optional().refine(v=>v!==undefined),
    owner_id: z.instanceof(Types.ObjectId).optional().refine(v=>v!==undefined),
    kyc_files:z.array(z.object({
        file_name:z.string().min(3,"File name must be at least 3 characters long"),
        file_url:z.url("Invalid file URL")
    })).optional().refine(v=>v!==undefined),
    verifiedAt:z.date().optional().refine(v=>v!==undefined)
})
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}
export type ISchoolInput=z.infer<typeof SchoolSchema>;