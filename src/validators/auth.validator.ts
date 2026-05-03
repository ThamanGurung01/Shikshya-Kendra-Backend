import {z, ZodError} from 'zod';
export const LoginSchema=z.object({
    email:z.email("Invalid email address"),
    password:z.string().min(6,"Password must be at least 6 characters long")
})
export const zodError=(parsedError:ZodError)=>{
    const tree=z.treeifyError(parsedError);
    return tree.errors;
}