import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} from '../controllers/book.controller';
import {
  issueBook,
  returnBook,
  getAllBookIssues,
  getLibrarianStats,
} from '../controllers/book-issue.controller';

/**
 * @swagger
 * tags:
 *   name: Book
 *   description: Library book management and issuance
 */

const bookRouter = Router();

// Stats routes
bookRouter.get(
  '/stats',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  getLibrarianStats
);

// Book issue/return routes
bookRouter.post(
  '/issue',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  issueBook
);
bookRouter.post(
  '/issue/:id/return',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  returnBook
);
bookRouter.get(
  '/issue',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  getAllBookIssues
);

// Standard CRUD routes for books
bookRouter.post(
  '/',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  createBook
);
bookRouter.get(
  '/',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN, Role.STUDENT, Role.TEACHER]),
  getAllBooks
);
bookRouter.get(
  '/:id',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN, Role.STUDENT, Role.TEACHER]),
  getBookById
);
bookRouter.put(
  '/:id',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  updateBook
);
bookRouter.delete(
  '/:id',
  authenticate,
  authorize([Role.LIBRARIAN, Role.ADMIN, Role.OADMIN]),
  deleteBook
);

export default bookRouter;
