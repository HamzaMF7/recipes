
import { z } from 'zod';
import { ERROR_CODES } from './constants';

// Enhanced Zod schemas with better validation
const NutritionSchema = z.object({
  calcium: z.number().nullable().optional(),
  calories: z.number().nullable().optional(),
  carbohydrates: z.number().nullable().optional(),
  cholesterol: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  fiber: z.number().nullable().optional(),
  iron: z.number().nullable().optional(),
  potassium: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  saturatedFat: z.number().nullable().optional(),
  sodium: z.number().nullable().optional(),
  sugar: z.number().nullable().optional(),
  vitaminA: z.number().nullable().optional(),
  vitaminC: z.number().nullable().optional(),
});

const IngredientSchema = z.object({
  amount: z.string().max(20, 'Amount is too long'),
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Ingredient name is too long'),
  notes: z.string().max(200, 'Notes are too long').optional(),
  unit: z.string().max(20, 'Unit is too long').optional(),
});


const OptionalUrlNull = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().url("Invalid URL").nullable() // allow string | null
);

const InstructionSchema = z.object({
  image: OptionalUrlNull, // "" -> null, valid URL -> string
  instruction: z.string().min(1, "Instruction text is required").max(1000),
  video: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().url("Invalid video URL").nullable()
  ),
});

const EquipmentSchema = z.object({
  link: OptionalUrlNull, // "" -> null
  name: z.string().min(1, "Equipment name is required").max(100),
});

const RecipeDataSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(200, 'Recipe name is too long'),
  author: z.string().max(100, 'Author name is too long').optional(),
  cookTime: z.number().optional(),
  cost: z.string().max(50, 'Cost is too long').optional(),
  cuisine: z.array(z.string()).optional(),
  datePublished: z.string().optional(),
  dietary: z.array(z.string()).optional(),
  difficulty: z.string().optional(), // Changed from enum to string since the JSON uses lowercase
  equipment: z.array(EquipmentSchema).max(20, 'Too many equipment items').default([]),
  ingredients: z.array(IngredientSchema)
    .min(1, 'At least one ingredient is required')
    .max(50, `Too many ingredients (max ${50})`),
  keywords: z.string().optional(), // Changed from union to string since the JSON uses string
  method: z.array(z.string()).optional(), // Changed from string to array of strings
  notes: z.string().max(2000, 'Notes are too long').optional(),
  nutrition: NutritionSchema.default({}),
  prepTime: z.number().optional(), // Changed from string to number
  protein: z.array(z.string()).optional(), // Changed from string to array of strings
  rating: z.number().min(0).max(5).optional(),
  servings: z.number().positive().max(50, 'Too many servings').optional(),
  servingsUnit: z.string().max(20, 'Servings unit is too long').optional(),
  source: z.union([
    z.string().url('Invalid source URL'),
    z.literal("") // Allow empty string
  ]).optional(),
  summary: z.string().max(500, 'Summary is too long').optional(),
  tips: z.string().max(2000, 'Tips are too long').optional(),
  totalTime: z.number().optional(), // Changed from string to number
  type: z.array(z.string()).optional(), // Changed from union to array of strings
  variations: z.string().max(2000, 'Variations are too long').optional(),
  instructions: z.array(InstructionSchema)
    .min(1, 'At least one instruction is required')
    .max(20, `Too many instructions (max ${20})`),
});

const FeaturedImageSchema = z.object({
  node: z.object({
    altText: z.string().max(200, 'Alt text is too long').optional().nullable(),
    title: z.string().max(200, 'Image title is too long').optional().nullable(),
    sourceUrl: z.string().url('Invalid image URL').nullable(),
  }),
}).optional().nullable();

export const RecipeSchema = z.object({
  id: z.string().min(1, 'Recipe ID is required'),
  content: z.string().optional(),
  recipeData: RecipeDataSchema,
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug is too long'),
  status: z.string(),
  uri: z.string().min(1, 'URI is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  featuredImage: FeaturedImageSchema,
});

// Export types
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeData = z.infer<typeof RecipeDataSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Instruction = z.infer<typeof InstructionSchema>;
export type Nutrition = z.infer<typeof NutritionSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;



// Error types
export type ErrorCode = keyof typeof ERROR_CODES;

export interface RecipeServiceError {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  timestamp: number;
}

// Pagination types
export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface RecipeListItem {
  id: string;
  title: string;
  slug: string;
  uri: string;
  featuredImage?: {
    node: {
      altText?: string;
      sourceUrl: string;
    };
  };
  recipeData: Pick<RecipeData, 'name' | 'rating' | 'totalTime' | 'difficulty' | 'servings' | 'cuisine'>;
}