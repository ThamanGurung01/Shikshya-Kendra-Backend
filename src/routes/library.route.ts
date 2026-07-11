import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  getBorrowers,
  getLibraryStats,
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  issueBook,
  getIssues,
  returnBook,
  getReturnsHistory,
} from "../controllers/library.controller";

const libraryRouter = Router();

// Protect all library routes with authentication and librarian/admin authorization
libraryRouter.use(authenticate);
libraryRouter.use(authorize([Role.OADMIN, Role.ADMIN, Role.LIBRARIAN]));

// Stats & Borrowers
libraryRouter.get("/stats", getLibraryStats);
libraryRouter.get("/borrowers", getBorrowers);

// Books Catalog
libraryRouter.get("/books", getBooks);
libraryRouter.post("/books", createBook);
libraryRouter.get("/books/:id", getBookById);
libraryRouter.patch("/books/:id", updateBook);
libraryRouter.delete("/books/:id", deleteBook);

// Issues
libraryRouter.get("/issues", getIssues);
libraryRouter.post("/issues", issueBook);

// Returns
libraryRouter.post("/returns/:id/return", returnBook);
libraryRouter.get("/returns/history", getReturnsHistory);

export default libraryRouter;
