import { User } from '../models/user.model';

const slugifyLocal = (str: string) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[\s\W-]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
};

const DOMAIN = '@shikshyakendra.com';

export const generateSchoolEmail = async (schoolName: string): Promise<string> => {
    const base = slugifyLocal(schoolName);
    let email = `${base}${DOMAIN}`;
    let count = 0;
    while (true) {
        const existing = await User.findOne({ email }).lean();
        if (!existing) return email;
        count++;
        email = `${base}${count}${DOMAIN}`;
    }
};

export const generateStudentEmail = async (studentName: string, schoolName: string): Promise<string> => {
    const namePart = slugifyLocal(studentName);
    const schoolPart = slugifyLocal(schoolName);
    let email = `${namePart}.${schoolPart}${DOMAIN}`;
    let count = 0;
    while (true) {
        const existing = await User.findOne({ email }).lean();
        if (!existing) return email;
        count++;
        email = `${namePart}.${schoolPart}${count}${DOMAIN}`;
    }
};
