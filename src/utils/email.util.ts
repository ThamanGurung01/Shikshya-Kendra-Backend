import { User } from '../models/user.model';

const sanitize = (str: string): string => {
    return str
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]/g, '');
};

const getYearSuffix = (): string => {
    return new Date().getFullYear().toString();
};

export const generateSchoolEmail = async (personName: string, schoolName: string): Promise<string> => {
    const namePart = sanitize(personName);
    const domain = sanitize(schoolName);
    const year = getYearSuffix();
    let email = `${namePart}${year}@${domain}.com`;
    let count = 0;
    while (true) {
        const existing = await User.findOne({ email }).lean();
        if (!existing) return email;
        count++;
        email = `${namePart}${year}${count}@${domain}.com`;
    }
};

export const generateStudentEmail = async (studentName: string, schoolName: string): Promise<string> => {
    const namePart = sanitize(studentName);
    const domain = sanitize(schoolName);
    const year = getYearSuffix();
    let email = `${namePart}${year}@${domain}.com`;
    let count = 0;
    while (true) {
        const existing = await User.findOne({ email }).lean();
        if (!existing) return email;
        count++;
        email = `${namePart}${year}${count}@${domain}.com`;
    }
};
