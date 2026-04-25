import {Schema,model,Types} from "mongoose";
export interface IRole{
    _id:Types.ObjectId;
    name:string;
    permissions:string[];
    created_at:Date;
    updated_at:Date;
}
const roleSchema=new Schema<IRole>({
    name:{type:String,required:true,unique:true},
    permissions:{ type: [String], default: [] }
},{
    timestamps:{createdAt:'created_at',updatedAt:'updated_at'}
});
export const Role=model<IRole>('Role',roleSchema);