import {Types} from 'mongoose';
import {z,ZodError} from 'zod';
import { userSchema } from './user.validator';

const studentSchema=z.object({
    address:z.string().min(5,"Address must be at least 5 characters long"),
    contact:z.string().min(10,"Contact number must be at least 10 characters long"),
    student_email:z.email("Invalid email address").optional().refine(v=>v!==undefined),
    school_id:z.string().refine(val=>Types.ObjectId.isValid(val),"Invalid school ID format"),
    user_id:z.instanceof(Types.ObjectId).optional().refine(v=>v!==undefined),
})

export const studentCreate=studentSchema.extend(userSchema.shape);
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}
export type IStudentInput=z.infer<typeof studentSchema>;