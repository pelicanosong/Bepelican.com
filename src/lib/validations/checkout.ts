import { z } from 'zod';

export const customerDetailsSchema = z.object({
  email: z.string()
    .trim()
    .email('Correo electrónico inválido')
    .max(255, 'El correo no puede tener más de 255 caracteres'),
  firstName: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  lastName: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede tener más de 100 caracteres'),
  phone: z.string()
    .trim()
    .regex(/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos'),
  documentType: z.enum(['CC', 'CE', 'NIT', 'PP'], {
    errorMap: () => ({ message: 'Tipo de documento inválido' })
  }),
  documentNumber: z.string()
    .trim()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede tener más de 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'El documento solo puede contener letras y números'),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
