import { BookModel, IBook } from '../models/book.model';
import { IBookInput } from '../validators/book.validator';

const cleanData = (obj: any): any => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const createBook = async (data: IBookInput) => {
  const bookData = cleanData({
    ...data,
    availableQuantity: data.quantity,
  });
  return await BookModel.create(bookData as any);
};

export const getAllBooks = async (
  schoolId: string,
  filter?: { search?: string; category?: string }
) => {
  const query: any = { schoolId };
  if (filter?.category) {
    query.category = filter.category;
  }
  if (filter?.search) {
    query.$or = [
      { title: { $regex: filter.search, $options: 'i' } },
      { author: { $regex: filter.search, $options: 'i' } },
      { isbn: { $regex: filter.search, $options: 'i' } },
    ];
  }
  return await BookModel.find(query).sort({ title: 1 }).lean();
};

export const getBookById = async (id: string) => {
  return await BookModel.findById(id).lean();
};

export const updateBookBySchool = async (
  id: string,
  schoolId: string,
  data: Partial<IBookInput>
) => {
  const currentBook = await BookModel.findOne({ _id: id, schoolId });
  if (!currentBook) return null;

  const updateData: any = { ...data };
  if (data.quantity !== undefined) {
    const diff = data.quantity - currentBook.quantity;
    updateData.availableQuantity = Math.max(0, currentBook.availableQuantity + diff);
  }

  const cleanedUpdate = cleanData(updateData);
  return await BookModel.findOneAndUpdate({ _id: id, schoolId }, cleanedUpdate as any, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const deleteBookBySchool = async (id: string, schoolId: string) => {
  return await BookModel.findOneAndDelete({ _id: id, schoolId });
};
