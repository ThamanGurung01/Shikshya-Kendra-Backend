import {z} from "zod"
export const userSchema=z.object({
    name:z.string().min(3,"Name must be at least 3 characters long"),
    profileImage:z.string().optional().refine(v=>v!==undefined),
    is_active:z.boolean().optional().refine(v=>v!==undefined),
    role:z.string().optional().refine(v=>v!==undefined)
});
export type IUserCreate=z.infer<typeof userSchema>;
export interface IUserInput extends IUserCreate {
    password: string;
}