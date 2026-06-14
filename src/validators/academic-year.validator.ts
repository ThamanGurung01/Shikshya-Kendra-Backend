import {z} from 'zod';
export const AcademicYearSchema=z.object({
    name:z.string().min(1,"Name is required"),
    startDate:z.string().min(1,"Start date is required"),
    endDate:z.string().min(1,"End date is required"),
    isCurrent:z.boolean().default(false),
});
export type IAcademicYearInput=z.infer<typeof AcademicYearSchema>;