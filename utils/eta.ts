import { Eta } from "eta";
import path from "node:path";

export const eta = new Eta({ views: path.join(import.meta.dirname, "views") });
