
-- Create FAQs table
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Public can view active faqs"
  ON public.faqs
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage faqs"
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed existing FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('¿Qué hace diferente a BePelican de otras agencias de viajes?', 'BePelican diseña experiencias de turismo de transformación que conectan a los viajeros con comunidades locales, cultura y naturaleza en Colombia. Cada experiencia busca generar impacto positivo en los territorios mientras el viajero vive algo auténtico, seguro y bien organizado.', 'general', 1),
('¿Qué incluye cada experiencia o tour?', 'Cada experiencia incluye actividades guiadas, acompañamiento de anfitriones o guías locales y la logística necesaria para desarrollar la actividad. Algunas experiencias también incluyen transporte, alimentación o aportes a proyectos comunitarios. Todos los detalles están especificados en la descripción de cada experiencia.', 'general', 2),
('¿Cómo puedo reservar una experiencia?', 'Solo debes seleccionar la experiencia que te interesa, elegir la fecha disponible y completar el proceso de reserva en línea. Una vez realizado el pago recibirás la confirmación con toda la información del tour.', 'reservas', 3),
('¿Puedo hablar con alguien antes de hacer la reserva?', 'Sí. Si tienes dudas o quieres recomendaciones, puedes escribirnos por WhatsApp, correo o a través del formulario de contacto. Nuestro equipo puede ayudarte a elegir la experiencia que mejor se adapte a tu tiempo e intereses.', 'reservas', 4),
('¿Qué medios de pago aceptan?', 'Aceptamos los medios de pago electrónicos habituales en Colombia, como PSE y tarjetas de crédito o débito, a través de una pasarela de pagos segura.', 'pagos', 5),
('¿Es seguro realizar el pago en la plataforma?', 'Sí. Los pagos se procesan a través de una pasarela certificada que utiliza sistemas de cifrado y seguridad para proteger la información financiera de los usuarios.', 'pagos', 6),
('¿Puedo reservar para varias personas en una sola compra?', 'Sí. Durante el proceso de reserva puedes seleccionar el número de personas que participarán en la experiencia, siempre que haya disponibilidad de cupos.', 'reservas', 7),
('¿Puedo pagar solo una parte al reservar?', 'En algunas experiencias es posible reservar con un anticipo y pagar el saldo restante antes del viaje. Las condiciones específicas se indican en cada experiencia o se confirman durante el proceso de reserva.', 'pagos', 8),
('¿Puedo cambiar la fecha después de reservar?', 'En muchos casos es posible reprogramar la experiencia si se solicita con anticipación y hay disponibilidad. Te recomendamos contactarnos lo antes posible para revisar las opciones.', 'reservas', 9),
('¿Dónde inicia la experiencia?', 'Cada experiencia tiene un punto de encuentro definido que se indica claramente en la descripción del tour. En algunos casos también se pueden coordinar traslados adicionales.', 'experiencia', 10),
('¿Necesito alguna condición física para participar?', 'Algunas experiencias, especialmente las que incluyen caminatas o actividades en naturaleza, pueden requerir una condición física básica. Estos requisitos siempre se especifican en la información del tour.', 'experiencia', 11),
('¿Qué debo llevar el día de la experiencia?', 'Generalmente recomendamos llevar ropa cómoda, calzado adecuado, documento de identidad, protección solar o impermeable según el clima y una botella de agua. Cada experiencia puede tener recomendaciones específicas.', 'experiencia', 12);
