import {z} from 'zod';

export const ParentSchema=z.object({
    fatherName:z.string().optional(),
    fatherPhone:z.string().optional(),
    motherName:z.string().optional(),
    motherPhone:z.string().optional(),
    guardianName:z.string().optional(),
    guardianPhone:z.string().optional(),
    userId:z.string().optional(),
    relation:z.string().optional(),
    primarygurdianemail:z.string().email('Invalid email address').optional(),
}).superRefine((data,ctx)=>{
    const hasFather=!!(data.fatherName||data.fatherPhone);
    const hasMother=!!(data.motherName||data.motherPhone);
    const hasGuardian=!!(data.guardianName||data.guardianPhone||data.relation);

    if(!hasFather&&!hasMother&&!hasGuardian){
        ctx.addIssue({
            code:'custom',
            message:'At least one parent or guardian is required',
        });
        return;
    }

    if(hasFather){
        if(!data.fatherName)ctx.addIssue({path:['fatherName'],message:'Father name is required when father is provided',code:'custom'});
        if(!data.fatherPhone)ctx.addIssue({path:['fatherPhone'],message:'Father phone is required when father is provided',code:'custom'});
    }

    if(hasMother){
        if(!data.motherName)ctx.addIssue({path:['motherName'],message:'Mother name is required when mother is provided',code:'custom'});
        if(!data.motherPhone)ctx.addIssue({path:['motherPhone'],message:'Mother phone is required when mother is provided',code:'custom'});
    }

    if(hasGuardian){
        if(!data.guardianName)ctx.addIssue({path:['guardianName'],message:'Guardian name is required when guardian is provided',code:'custom'});
        if(!data.guardianPhone)ctx.addIssue({path:['guardianPhone'],message:'Guardian phone is required when guardian is provided',code:'custom'});
        if(!data.relation)ctx.addIssue({path:['relation'],message:'Guardian relation is required when guardian is provided',code:'custom'});
    }
});

export type IParentInput=z.infer<typeof ParentSchema>;
