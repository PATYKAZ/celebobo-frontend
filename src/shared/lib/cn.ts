import clsx, { type ClassValue } from "clsx";

/** Concatène des classes conditionnelles. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
