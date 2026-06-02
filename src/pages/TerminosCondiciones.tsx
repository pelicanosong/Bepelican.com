import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BePelicanHeader from "@/components/bepelican/BePelicanHeader";
import BePelicanFooter from "@/components/bepelican/BePelicanFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Users, ShieldCheck, Scale, Globe, Briefcase, Landmark, Phone, CheckCircle, BookOpen, Building2, CreditCard, Star, RotateCcw, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  letter: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "generalidades",
    letter: "A",
    title: "Generalidades acerca de nuestro sitio web",
    icon: <Globe className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Los presentes Términos y Condiciones regulan los derechos y obligaciones de los usuarios de la plataforma web{" "}
          <a href="https://www.bepelican.com" className="text-primary underline font-medium" target="_blank" rel="noopener noreferrer">www.bepelican.com</a>,
          en adelante, "BePelican", de propiedad de la sociedad comercial <strong className="text-foreground">Be Pelican S.A.S. B.I.C.</strong>, legalmente constituida, identificada con NIT 901399254-5, con domicilio principal en Bogotá, Colombia.
        </p>
        <p>
          Este documento es vinculante tanto para BePelican como para toda persona natural o jurídica que navegue, se registre, compre, publique, oferte, use o interactúe con la plataforma. En caso de actuar en representación de una persona jurídica, usted declara contar con autorización expresa y suficiente para obligarla conforme a estos Términos y Condiciones.
        </p>
        <p>
          BePelican podrá modificar en cualquier momento el presente documento, sin previo aviso. Por esta razón, corresponde a cada usuario revisarlo cada vez que acceda a la plataforma, con el fin de conocer las condiciones vigentes de uso.
        </p>
        <p>
          Si usted no está de acuerdo con lo aquí dispuesto, deberá abstenerse de ingresar, navegar o utilizar cualquiera de los servicios ofrecidos por BePelican.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">
            Para cualquier observación, inquietud o solicitud relacionada con estos Términos y Condiciones, puede escribir a:{" "}
            <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "capacidad",
    letter: "B",
    title: "Capacidad",
    icon: <ShieldCheck className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Los servicios de BePelican solo están disponibles para personas que hayan alcanzado la mayoría de edad conforme a la legislación aplicable en su lugar de residencia.</p>
        <p>Si una persona actúa en representación de una persona jurídica, deberá contar con autorización expresa y suficiente para obligarla válidamente.</p>
        <p>Quien no cumpla con estas condiciones deberá abstenerse de usar la plataforma y sus servicios.</p>
      </div>
    ),
  },
  {
    id: "usuarios",
    letter: "C",
    title: "Usuarios",
    icon: <Users className="h-5 w-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>Toda persona que acceda o utilice BePelican tendrá la calidad de usuario. Los usuarios podrán interactuar con la plataforma en una de las siguientes modalidades:</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">1. No registrado</span>
            <p className="text-sm">Navega o utiliza BePelican sin cuenta registrada. La plataforma podrá recolectar datos de navegación o uso. Consulte la <Link to="/privacidad" className="text-primary underline">Política de Privacidad</Link>.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">2. Registrado</span>
            <p className="text-sm">Persona que ha realizado el proceso de registro creando una cuenta personal con usuario y contraseña.</p>
          </div>
        </div>

        <p>Los usuarios registrados que comercialicen productos o servicios deberán cumplir con la Política de Privacidad y las normas legales aplicables. BePelican podrá suspender o eliminar cuentas involucradas en conductas que vulneren derechos de terceros.</p>

        {/* Sub-sections */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="c1" className="border-border/50">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              C.1 Condiciones de la cuenta de usuario
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>Al crear una cuenta, el usuario se obliga a suministrar información veraz, exacta, actualizada y completa.</p>
              <p>La cuenta es personal e intransferible. El usuario no podrá compartir su contraseña con terceros. Si sospecha de un acceso no autorizado, deberá notificarlo a: <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>.</p>
              <p>BePelican podrá solicitar documentos adicionales para verificar la identidad del usuario.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c2" className="border-border/50">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              C.2 Responsabilidad sobre la cuenta
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              El usuario será el único responsable por todas las actividades realizadas desde su cuenta, así como por cualquier uso indebido que infrinja estos Términos, la Política de Privacidad o la legislación aplicable.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c3" className="border-border/50">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              C.3 Permanencia y cancelación
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-3">
              <p>BePelican podrá suspender, restringir o eliminar cuentas cuando detecte que la cuenta:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>No es segura</li>
                <li>Está siendo usada por más de una persona</li>
                <li>Contiene información falsa</li>
                <li>Infringe estos Términos y Condiciones</li>
                <li>Vulnera la Política de Privacidad</li>
                <li>Afecta derechos de terceros o el funcionamiento de la plataforma</li>
              </ul>
              <p>Para eliminar su cuenta, solicítelo a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>. Plazo de procesamiento: hasta 72 horas hábiles.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c4" className="border-border/50 border-b-0">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              C.4 Exoneración de responsabilidad
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              BePelican no será responsable por los actos u omisiones realizados por los usuarios a través de sus cuentas, salvo en los casos en que la ley disponga expresamente lo contrario.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: "propiedad-intelectual",
    letter: "D",
    title: "Propiedad intelectual",
    icon: <BookOpen className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Todos los contenidos de la plataforma, incluidos textos, imágenes, fotografías, videos, diseños, software, marcas, nombres comerciales, logotipos, enseñas, bases de datos, apariencia gráfica, signos distintivos y demás elementos protegidos por propiedad intelectual, son de titularidad de BePelican o de terceros que han autorizado su uso.</p>
        <p>El usuario se obliga a no copiar, reproducir, modificar, distribuir, explotar, transformar, publicar o usar indebidamente dichos contenidos sin autorización previa, expresa y por escrito del titular correspondiente.</p>
        <p>Cualquier uso no autorizado podrá dar lugar al ejercicio de las acciones legales pertinentes.</p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-xs">Si considera que algún contenido infringe derechos de propiedad intelectual, infórmelo a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a> con asunto: <em>"Infracción de propiedad intelectual"</em>.</p>
        </div>
      </div>
    ),
  },
  {
    id: "licencia-proveedores",
    letter: "E",
    title: "Licencia de uso otorgada por usuarios proveedores",
    icon: <FileText className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Los usuarios proveedores que publiquen contenidos otorgan a BePelican una licencia de uso <strong className="text-foreground">gratuita, no exclusiva, internacional</strong>, revocable respecto de publicaciones retiradas, para usar, reproducir, comunicar públicamente, adaptar, transformar y publicar dicho contenido con fines operativos, promocionales, comerciales, publicitarios y de funcionamiento de la plataforma.</p>
        <p>Esta autorización incluye el uso del contenido en sitios web, redes sociales, campañas, catálogos, materiales promocionales y alianzas estratégicas.</p>
        <p>El usuario proveedor declara que es titular o licenciatario autorizado del contenido publicado. Será el único responsable por cualquier reclamación de terceros derivada de una eventual infracción.</p>
        <p>BePelican podrá retirar contenidos cuando, a su juicio, infrinjan la ley, estos Términos y Condiciones o derechos de terceros.</p>
      </div>
    ),
  },
  {
    id: "servicios",
    letter: "F",
    title: "Servicios ofrecidos en la plataforma",
    icon: <Briefcase className="h-5 w-5" />,
    content: (
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <Accordion type="multiple" className="w-full">
          {/* F.1 Mercado Local */}
          <AccordionItem value="f1" className="border-border/50">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> F.1 Mercado Local</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm text-muted-foreground">
              <p>BePelican ofrece un espacio digital para que usuarios registrados publiquen, ofrezcan y comercialicen productos.</p>

              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-primary/20">
                <AccordionItem value="f11" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.1.1 Publicación de productos</AccordionTrigger>
                  <AccordionContent className="text-xs">Solo podrán ofrecer productos quienes cuenten con cuenta habilitada. Cada producto es una publicación individual que deberá cumplir con estos Términos y la normativa legal.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f12" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.1.2 Obligaciones del proveedor</AccordionTrigger>
                  <AccordionContent className="text-xs space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ser propietario o estar autorizado para comercializar el producto</li>
                      <li>Ofrecer únicamente productos de comercio legal</li>
                      <li>Informar precios completos incluyendo impuestos</li>
                      <li>Suministrar información cierta, clara y verificable</li>
                      <li>Indicar vigencia limitada de la oferta, cuando aplique</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f13" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.1.3 Responsabilidad sobre productos</AccordionTrigger>
                  <AccordionContent className="text-xs">BePelican actúa como intermediario tecnológico. Podrá suspender o retirar publicaciones fraudulentas, engañosas o ilícitas.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f14" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline"><span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-primary" /> F.1.4 Medios de pago</span></AccordionTrigger>
                  <AccordionContent className="text-xs space-y-2">
                    <p>Los únicos medios válidos serán los habilitados dentro de la plataforma. Proveedor autorizado: <strong>ePayco, Paga y Cobra Online S.A.S.</strong>, NIT 900.471.052-8.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f15" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline"><span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> F.1.5 Sistema de reputación</span></AccordionTrigger>
                  <AccordionContent className="text-xs">Los proveedores podrán ser calificados. BePelican podrá suspender cuentas con bajos niveles de reputación o quejas reiteradas.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f16" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline"><span className="flex items-center gap-1"><RotateCcw className="h-3 w-3 text-primary" /> F.1.6 Retracto y devoluciones</span></AccordionTrigger>
                  <AccordionContent className="text-xs space-y-2">
                    <p>Derecho de retracto: 5 días hábiles siguientes a la entrega (Art. 47, Ley 1480 de 2011), cuando el bien pueda devolverse en las mismas condiciones.</p>
                    <p>Solicítelo desde su cuenta o a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a> con asunto: <em>"Retracto de compra"</em>.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f17" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.1.7 Reversión del pago</AccordionTrigger>
                  <AccordionContent className="text-xs">En caso de fraude u operación no solicitada, solicite la reversión a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f18" className="border-border/30 border-b-0">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline"><span className="flex items-center gap-1"><Percent className="h-3 w-3 text-primary" /> F.1.8 Tarifas y comisiones</span></AccordionTrigger>
                  <AccordionContent className="text-xs">
                    <p>Comisión estándar Mercado Local: <strong className="text-foreground">16% + IVA</strong> sobre el valor de la venta. Planes de visibilidad preferencial: hasta <strong className="text-foreground">19% + IVA</strong>.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* F.2 Turismo */}
          <AccordionItem value="f2" className="border-border/50">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> F.2 Turismo</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm text-muted-foreground">
              <p>BePelican ofrece un espacio digital para facilitar el encuentro entre usuarios compradores y proveedores turísticos. Categorías: aventura, alojamiento, cultura, naturaleza, solidario, bienestar, accesible, paz, MICE y experiencias de aprendizaje.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">a. Contacto directo</p>
                  <p className="text-xs">El usuario se comunica directamente con el proveedor. BePelican no recauda dinero ni asume responsabilidad.</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground mb-1">b. Plan gestionado por BePelican</p>
                  <p className="text-xs">Comunicación, reserva y pago dentro de la plataforma con medios autorizados.</p>
                </div>
              </div>

              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-primary/20">
                <AccordionItem value="f22" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.2.2 Reservas y pagos</AccordionTrigger>
                  <AccordionContent className="text-xs">Una reserva solo se completa cuando el pago mínimo exigido se ha acreditado exitosamente. Las fechas dependen de la información del proveedor.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f23" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.2.3 Derecho de retracto</AccordionTrigger>
                  <AccordionContent className="text-xs">5 días hábiles tras la reserva (Art. 47, Ley 1480 de 2011). Solicítelo a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a> con asunto: <em>"Retracto de compra de servicio turístico"</em>.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f24" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.2.4 Cancelaciones fuera del retracto</AccordionTrigger>
                  <AccordionContent className="text-xs">Se rigen por la política definida por el proveedor en su publicación. Léalas cuidadosamente antes de reservar.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f25" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.2.5 Obligaciones del proveedor turístico</AccordionTrigger>
                  <AccordionContent className="text-xs space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Información clara y verificable</li>
                      <li>Identificación completa (NIT, dirección, etc.)</li>
                      <li>Registro Nacional de Turismo cuando exigible</li>
                      <li>Tarifas, impuestos, cargos y restricciones transparentes</li>
                      <li>No publicidad engañosa ni cláusulas abusivas</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f26" className="border-border/30 border-b-0">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.2.6 Protección al turista</AccordionTrigger>
                  <AccordionContent className="text-xs">Presente quejas a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a> indicando si se trata de queja o reclamo turístico.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* F.3 Nómadas Digitales */}
          <AccordionItem value="f3" className="border-border/50 border-b-0">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> F.3 Nómadas Digitales</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm text-muted-foreground">
              <p>BePelican facilita la oferta y adquisición de servicios, cursos, contenidos y experiencias en categorías como academia, networking, blogger, voluntariados y experiencias de aprendizaje.</p>
              <Accordion type="multiple" className="w-full pl-4 border-l-2 border-primary/20">
                <AccordionItem value="f32" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.3.2 Modalidades de oferta</AccordionTrigger>
                  <AccordionContent className="text-xs">Publicaciones pagas por suscripción o sin costo con comisión por venta exitosa (estándar: 16% + IVA).</AccordionContent>
                </AccordionItem>
                <AccordionItem value="f33" className="border-border/30">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.3.3 Reservas y pagos</AccordionTrigger>
                  <AccordionContent className="text-xs">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded border border-border p-3"><strong className="text-foreground block text-[11px] mb-1">Contacto directo</strong><span className="text-[11px]">Negociación directa entre partes.</span></div>
                      <div className="rounded border border-border p-3"><strong className="text-foreground block text-[11px] mb-1">Gestionado por BePelican</strong><span className="text-[11px]">Reserva y pago dentro de la plataforma.</span></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f35" className="border-border/30 border-b-0">
                  <AccordionTrigger className="text-xs font-medium hover:no-underline">F.3.5 Retracto y cancelaciones</AccordionTrigger>
                  <AccordionContent className="text-xs">Solicite retracto a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a> con asunto: <em>"Retracto de compra de servicio"</em>.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: "responsabilidad",
    letter: "G",
    title: "Responsabilidad de BePelican",
    icon: <Scale className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>BePelican pone a disposición una plataforma tecnológica para facilitar interacciones entre usuarios, proveedores y compradores.</p>
        <p>Salvo en los casos previstos por la ley, BePelican <strong className="text-foreground">no garantiza ni responde por:</strong></p>
        <ul className="space-y-2 pl-1">
          {[
            "La calidad, idoneidad, legalidad o seguridad de productos y servicios de terceros",
            "La veracidad total de la información publicada por los usuarios",
            "El cumplimiento contractual entre compradores y proveedores",
            "Perjuicios derivados de conductas, omisiones o fraudes de terceros",
            "Acuerdos celebrados fuera de los canales autorizados",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>BePelican podrá intervenir como facilitador o mediador sin asumir responsabilidad solidaria.</p>
      </div>
    ),
  },
  {
    id: "canales",
    letter: "H",
    title: "Canales de comunicación autorizados",
    icon: <Phone className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <p className="font-semibold text-foreground text-base">Be Pelican S.A.S. B.I.C.</p>
          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground/70">NIT:</span> <span className="text-foreground">901399254-5</span></p>
            <p><span className="text-muted-foreground/70">Domicilio:</span> <span className="text-foreground">Bogotá, Colombia</span></p>
            <p><span className="text-muted-foreground/70">Web:</span> <a href="https://www.bepelican.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.bepelican.com</a></p>
            <p><span className="text-muted-foreground/70">Email:</span> <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a></p>
            <p><span className="text-muted-foreground/70">WhatsApp:</span> <a href="http://wa.me/573135525944" target="_blank" rel="noopener noreferrer" className="text-primary font-medium">+57 313 552 5944</a></p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70">BePelican no reconocerá como obligatorias las comunicaciones sostenidas por canales distintos a los expresamente autorizados.</p>
      </div>
    ),
  },
  {
    id: "privacidad",
    letter: "I",
    title: "Política de privacidad",
    icon: <ShieldCheck className="h-5 w-5" />,
    content: (
      <div className="text-sm leading-relaxed text-muted-foreground">
        <p>Hace parte integral de estos Términos y Condiciones la <Link to="/privacidad" className="text-primary underline font-medium">Política de Privacidad</Link> de BePelican, la cual se entiende aceptada por el usuario al utilizar la plataforma.</p>
      </div>
    ),
  },
  {
    id: "ley",
    letter: "J",
    title: "Ley aplicable y jurisdicción",
    icon: <Landmark className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Los presentes Términos y Condiciones se regirán e interpretarán de conformidad con las leyes de la <strong className="text-foreground">República de Colombia</strong>.</p>
        <p>Cualquier controversia será sometida a la jurisdicción de los jueces competentes de la República de Colombia, salvo disposición legal imperativa en contrario.</p>
      </div>
    ),
  },
  {
    id: "aceptacion",
    letter: "K",
    title: "Aceptación",
    icon: <CheckCircle className="h-5 w-5" />,
    content: (
      <div className="text-sm leading-relaxed text-muted-foreground">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <p>El ingreso, navegación, registro, publicación, compra, reserva o uso de cualquier servicio disponible en BePelican implica la <strong className="text-foreground">aceptación expresa, plena e incondicional</strong> de los presentes Términos y Condiciones.</p>
        </div>
      </div>
    ),
  },
];

const TerminosCondiciones = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Términos y Condiciones - BePelican";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader />

      {/* Hero */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-3">Documento legal</p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-2xl">
              Condiciones de uso de la plataforma BePelican. Al utilizar nuestros servicios, usted acepta estos términos.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-10">
          {/* Sidebar nav — desktop only */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contenido</p>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <nav className="space-y-1 pr-4">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setActiveSection(s.id)}
                      className={cn(
                        "flex items-center gap-2 text-xs py-2 px-3 rounded-lg transition-colors",
                        activeSection === s.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="font-mono text-[10px] opacity-60">{s.letter}</span>
                      <span className="truncate">{s.title}</span>
                    </a>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 max-w-3xl">
            <Accordion
              type="multiple"
              defaultValue={sections.map((s) => s.id)}
              className="w-full"
              onValueChange={(vals) => {
                if (vals.length > 0) setActiveSection(vals[vals.length - 1]);
              }}
            >
              {sections.map((section) => (
                <AccordionItem key={section.id} value={section.id} id={section.id} className="border-border">
                  <AccordionTrigger className="hover:no-underline group py-5">
                    <div className="flex items-center gap-3 text-left">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary/20">
                        {section.icon}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{section.letter}</span>
                        <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight">{section.title}</h2>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-12 pb-8">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </main>
        </div>
      </div>

      <BePelicanFooter />
    </div>
  );
};

export default TerminosCondiciones;
