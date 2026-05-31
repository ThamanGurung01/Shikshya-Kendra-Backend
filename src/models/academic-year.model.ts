import {Schema,Types,model} from "mongoose";
export interface IAcademicYear{
  schoolId: Types.ObjectId;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
const academicYearSchema= new Schema<IAcademicYear>({
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    name:{type:String,required:true},
    startDate:{type:String,required:true},
    endDate:{type:String,required:true},
    isCurrent:{type:Boolean,required:true}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const AcademicYear=model<IAcademicYear>('AcademicYear',academicYearSchema);