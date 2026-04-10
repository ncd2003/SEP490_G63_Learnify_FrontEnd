import { z } from "zod";

export const CreatePaymentRequestSchema = z.object({
  userId: z.number().int().positive(),
  planId: z.number().int().positive(),
  amount: z.number().int().positive(),
});

export const CreatePaymentResultSchema = z.union([
  z.string().url(),
  z
    .object({
      checkoutUrl: z.string().url(),
    })
    .passthrough(),
]);

/**
 * @typedef {import("zod").infer<typeof CreatePaymentRequestSchema>} TCreatePaymentRequest
 * @typedef {{ checkoutUrl: string }} TCreatePaymentResult
 */
