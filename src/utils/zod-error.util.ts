import { ZodError } from "zod";

export const zodError = (parsedError: ZodError): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    for (const issue of parsedError.issues) {
        const path = issue.path.join(".") || "_root";
        (result[path] ??= []).push(issue.message);
    }
    return result;
};
