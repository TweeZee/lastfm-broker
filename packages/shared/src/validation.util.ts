import {z} from "zod";

/**
 * Returns a Zod type that can parse a boolean or a string that can be coerced to a boolean.
 */
const boolish = () => z.enum(["true", "false"]).or(z.boolean()).transform((val) => val.toString() === "true");

/**
 * Returns a Zod type that can parse a number or a string that can be coerced to a number.
 */
const numeric = () => z.string().or(z.number()).pipe(z.coerce.number());

/**
 * Returns a Zod type that can parse a port number from a string or an integer number.
 */
const port = () => numeric().pipe(z.number().int().min(1024).max(65535));

export const zz = {
    boolish,
    numeric,
    port,
}