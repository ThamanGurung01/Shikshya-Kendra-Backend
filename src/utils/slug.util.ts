import { Model } from 'mongoose';

const slugify = (str: string) => {
    return str
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const generateUniqueSlug = async (model: Model<any>, name: string, excludeId?: string) => {
    const base = slugify(name || '');
    let slug = base;
    let count = 0;
    while (true) {
        const query: any = { slug };
        if (excludeId) query._id = { $ne: excludeId };
        const existing = await model.findOne(query).lean();
        if (!existing) return slug;
        count++;
        slug = `${base}-${count}`;
    }
}

export default generateUniqueSlug;
