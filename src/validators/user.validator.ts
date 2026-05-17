import {z,ZodError} from "zod"
export const userSchema=z.object({
    name:z.string().min(3,"Name must be at least 3 characters long"),
    email:z.email("Invalid email address"),
    password:z.string().min(6,"Password must be at least 6 characters long"),
    profileImage:z.string().optional().refine(v=>v!==undefined),
    is_active:z.boolean().optional().refine(v=>v!==undefined),
    role:z.string().optional().refine(v=>v!==undefined)
});
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}
export type IUserInput=z.infer<typeof userSchema>;