import { Response } from 'express';
import { Types } from 'mongoose';
import * as BookService from '../services/book.service';
import { zodError } from '../utils/zod-error.util';
import { BookSchema } from '../validators/book.validator';
import { sendError, sendSuccess } from '../utils/response.util';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const parsed = BookSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdBook = await BookService.createBook(parsed.data);
    return sendSuccess(res, 'Book created successfully', createdBook, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAllBooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    const filter: { search?: string; category?: string } = {};
    if (search) filter.search = search;
    if (category) filter.category = category;

    const books = await BookService.getAllBooks(schoolId, filter);
    if (books.length === 0) return sendSuccess(res, 'Books not found', [], 200);
    return sendSuccess(res, 'Books retrieved successfully', books, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getBookById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const book = await BookService.getBookById(id);
    if (!book) return sendSuccess(res, 'Book not found', {}, 200);

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    if (book.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    return sendSuccess(res, 'Book retrieved successfully', book, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = BookSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const updatedBook = await BookService.updateBookBySchool(id, schoolId, parsed.data as any);
    if (!updatedBook) return sendError(res, 'Book not found', undefined, 404);

    return sendSuccess(res, 'Book updated successfully', updatedBook, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const deleteBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const book = await BookService.deleteBookBySchool(id, schoolId);
    if (!book) return sendError(res, 'Book not found', undefined, 404);

    return sendSuccess(res, 'Book deleted successfully', book, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};
