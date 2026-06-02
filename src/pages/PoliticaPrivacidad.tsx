import { useEffect, useState } from "react";
import BePelicanHeader from "@/components/bepelican/BePelicanHeader";
import BePelicanFooter from "@/components/bepelican/BePelicanFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck, Building2, BookOpen, Globe, FileText, Users, Lock,
  Send, AlertTriangle, Baby, Globe2, MessageSquare, Eye, Cookie,
  Target, UserCheck, HelpCircle, ClipboardList, Scale, Mail, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "aviso",
    number: "1",
    title: "Aviso de Protección de Datos",
    icon: <ShieldCheck className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          La presente Política de Tratamiento de Datos Personales, en adelante la "Política", tiene como objeto establecer e informar el tratamiento que da <strong className="text-foreground">BE PELICAN S.A.S. B.I.C.</strong> a los Datos Personales de quienes los han proporcionado, tales como proveedores, clientes, asociados y empleados.
        </p>
        <p>
          Esta Política define los requerimientos mínimos para asegurar un adecuado nivel de protección dentro de BE PELICAN S.A.S. B.I.C. para la recopilación, uso, revelación, transferencia, almacenamiento y demás procesos relacionados con Datos Personales.
        </p>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            BE PELICAN enfatiza su compromiso con la privacidad y la protección de los Datos Personales.
          </p>
        </div>
        <p>
          Esta Política se aplicará a todas las bases de datos y/o archivos que contengan Datos Personales que sean objeto de tratamiento por parte de BE PELICAN S.A.S. B.I.C. en calidad de responsable. Aplicará a todos los canales de comunicación e interacción que adelante la sociedad y en los que se recolecten Datos Personales, tales como Datos Personales Sensibles, comerciales y/o administrativos, entre otros.
        </p>
      </div>
    ),
  },
  {
    id: "responsable",
    number: "2",
    title: "Identificación del Responsable",
    icon: <Building2 className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong className="text-foreground">BE PELICAN S.A.S. B.I.C.</strong> es una sociedad con domicilio en Bogotá, Colombia.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-center">
            <Mail className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Correo electrónico</p>
            <a href="mailto:management@bepelican.com" className="text-sm text-primary font-medium block">management@bepelican.com</a>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-center">
            <Phone className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Teléfono / WhatsApp</p>
            <a href="http://wa.me/573135525944" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors">+57 313 552 5944</a>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-center">
            <Globe className="h-5 w-5 mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Sitio web</p>
            <a href="https://www.bepelican.com" className="text-sm text-primary font-medium block" target="_blank" rel="noopener noreferrer">www.bepelican.com</a>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "definiciones",
    number: "3",
    title: "Definiciones",
    icon: <BookOpen className="h-5 w-5" />,
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {[
          { term: "Bases de Datos", def: "El conjunto ordenado de Datos Personales referentes a una persona identificada o identificable, el cual va a ser objeto de tratamiento." },
          { term: "Datos Personales", def: "Cualquier información, material audiovisual, pieza de información y/o cualquier otra información relacionada que esté vinculada o que pueda asociarse a una o varias personas determinadas o determinables. Incluyen los datos privados de la Ley 1266 de 2008." },
          { term: "Datos Personales Sensibles", def: "Datos que afectan la intimidad del titular o cuyo uso indebido puede generar discriminación, tales como origen racial o étnico, orientación política, convicciones religiosas o filosóficas, pertenencia a sindicatos, datos de salud, vida sexual y datos biométricos." },
          { term: "Encargado", def: "Persona natural o jurídica que por sí misma o en asocio con otros realice el tratamiento de Datos Personales por cuenta de BE PELICAN S.A.S. B.I.C." },
          { term: "Normativa Aplicable", def: "Cualquier legislación de protección de datos aplicable, incluyendo Ley 1266 de 2008, Ley 1581 de 2012, Decreto 1377 de 2013, Constitución Política de Colombia, Ley 1480 de 2011 y circulares de la SIC." },
          { term: "Responsable", def: "Persona natural o jurídica que decide sobre la base de datos y/o el tratamiento de los Datos Personales." },
          { term: "SIC", def: "Superintendencia de Industria y Comercio." },
          { term: "Titular", def: "La persona a quien corresponden los Datos Personales objeto de tratamiento." },
          { term: "Transferencia", def: "Comunicación de datos por parte del responsable y/o encargado a un receptor ubicado dentro o fuera del país." },
          { term: "Transmisión", def: "Tratamiento que implica la comunicación de datos dentro o fuera de Colombia por el encargado por cuenta del responsable." },
          { term: "Tratamiento", def: "Cualquier operación sobre Datos Personales, tales como recolección, transferencia, almacenamiento, uso, circulación o supresión." },
        ].map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <p className="font-semibold text-foreground text-sm mb-1">{item.term}</p>
            <p className="text-xs text-muted-foreground">{item.def}</p>
          </div>
        ))}
        <div className="bg-muted/50 rounded-lg p-4 border border-border mt-4">
          <p className="text-xs text-muted-foreground">
            Esta Política deberá ser revisada por lo menos cada dos años. BE PELICAN S.A.S. B.I.C. se reserva el derecho de modificar su contenido sin previo aviso. Una vez actualizada, estará disponible para consulta y se notificará a los titulares los cambios realizados.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "generalidades",
    number: "4",
    title: "Generalidades",
    icon: <Scale className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Durante el tratamiento de los Datos Personales, BE PELICAN S.A.S. B.I.C. cumplirá con los principios rectores de protección de datos:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Legalidad", "Finalidad", "Libertad", "Veracidad", "Transparencia", "Acceso restringido", "Seguridad", "Confidencialidad"].map((p) => (
            <div key={p} className="text-center rounded-lg bg-primary/5 border border-primary/10 py-2 px-3">
              <span className="text-xs font-medium text-primary">{p}</span>
            </div>
          ))}
        </div>
        <p>
          Para el tratamiento de los Datos Personales, BE PELICAN solicitará la autorización previa, expresa, informada y clara por parte del titular, salvo en los casos permitidos por la normativa.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm font-medium text-foreground mb-2">No será necesario el consentimiento cuando:</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>La información sea requerida por una entidad pública o por orden judicial.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Se trate de datos de naturaleza pública.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Existan casos de urgencia médica o sanitaria.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Se trate de información autorizada por la ley para fines históricos, estadísticos o científicos.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Se trate de datos relacionados con el registro civil de las personas.</li>
          </ul>
        </div>
        <p>
          Los Datos Personales solo serán objeto de tratamiento durante el tiempo que sea razonable y necesario, de acuerdo con las finalidades que lo justificaron. Una vez cumplida la finalidad, BE PELICAN procederá a la supresión de los datos en su posesión, salvo obligación legal o contractual de conservarlos.
        </p>
        <p>
          BE PELICAN proporcionará las medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros, evitando su adulteración, pérdida, consulta, uso o acceso no autorizado. La compañía exigirá a los terceros con quienes intercambie información la adopción de medidas adecuadas para la protección de los datos.
        </p>
      </div>
    ),
  },
  {
    id: "cookies",
    number: "5",
    title: "Cookies y Tecnologías de Seguimiento",
    icon: <Cookie className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Al acceder o utilizar los servicios de BE PELICAN, esta podrá recopilar información de forma pasiva a través de tecnologías como cookies, con las cuales se recolecta información sobre el hardware, software, dirección IP, tipo de navegador, sistema operativo, nombre de dominio y tiempo de acceso.
        </p>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="browser" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> A través de su navegador</span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Cierta información es recopilada por la mayoría de los navegadores, como su dirección MAC, tipo de equipo, resolución de pantalla, versión del sistema operativo, tipo y versión del navegador. También se podrá recopilar información similar desde dispositivos móviles.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cookies" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Cookie className="h-4 w-4 text-primary" /> Uso de cookies</span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Las cookies permiten recopilar información como el tipo de navegador, tiempo de permanencia, páginas visitadas y preferencias de idioma. Se utilizan por seguridad, para facilitar la navegación, personalizar la experiencia, recordar elementos del carrito y obtener estadísticas. El usuario puede negarse a aceptar cookies siguiendo las instrucciones de su navegador.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pixels" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Etiquetas de píxel y tecnologías similares</span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Estas herramientas pueden ser utilizadas en algunas páginas del sitio y mensajes de correo electrónico para hacer seguimiento a acciones de usuarios, medir el éxito de campañas y compilar estadísticas de uso y tasas de respuesta.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ads" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /> Publicidad conductual en línea</span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Estas tecnologías pueden permitir a proveedores externos ofrecer anuncios sobre productos y servicios usando información sobre sus visitas para mostrarle contenidos de interés.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ip" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Dirección IP y datos del dispositivo</span>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Su dirección IP es asignada por su proveedor de internet y puede quedar registrada para calcular niveles de uso, diagnosticar problemas del servidor y administrar el sitio. También podremos recopilar información sobre su dispositivo móvil, como un identificador único.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-xs font-medium text-foreground mb-2">Información que nos proporciona directamente:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["Apodo / seudónimo", "Nombre e imagen", "Documento de identidad", "Datos de contacto", "Cuenta bancaria", "Medios de pago"].map((item) => (
              <div key={item} className="text-xs text-muted-foreground bg-background rounded px-2 py-1.5 border border-border text-center">{item}</div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tratamiento",
    number: "6",
    title: "Tratamiento y Finalidad",
    icon: <Target className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          BE PELICAN S.A.S. B.I.C., actuando en calidad de responsable del tratamiento, recolecta, almacena, usa, circula, suprime, procesa, compila, reproduce, intercambia, actualiza, dispone, comunica y transmite Datos Personales para las siguientes finalidades:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Actividades propias del objeto social",
            "Actividades comerciales y de mercadeo",
            "Envío de información sobre productos y campañas",
            "Seguimiento a actividades y calidad de servicios",
            "Cumplimiento de obligaciones legales y contractuales",
            "Análisis de datos y estudios de mercado",
            "Respuesta a consultas y solicitudes",
            "Seguimiento de quejas de calidad",
            "Gestión de recursos humanos",
            "Compartir información con proveedores de servicios",
            "Responder solicitudes de autoridades públicas",
            "Cumplimiento de términos y condiciones",
            "Protección de operaciones y derechos",
            "Identificación y contacto de usuarios",
            "Registro en sistemas y verificación de identidad",
            "Brindar productos y servicios solicitados",
            "Facilitar contacto comprador-vendedor",
            "Elaborar registros de operaciones",
            "Gestionar plataforma de e-commerce y pagos",
            "Atender comentarios y soporte",
            "Elaborar perfiles de análisis crediticio",
            "Gestionar cobranza cuando corresponda",
            "Facilitar envíos de productos",
            "Ofrecer servicios ajustados al usuario",
            "Permitir participación en concursos o sorteos",
            "Contribuir a seguridad de transacciones",
            "Elaborar sistema de reputación",
            "Estudios internos sobre intereses y comportamientos",
            "Elaborar perfiles para personalización",
            "Comunicación por distintos canales",
            "Programas de fidelización",
            "Integraciones tecnológicas y APIs",
            "Contacto con fines publicitarios",
            "Mercadotecnia y prospección comercial",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-2">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Inteligencia Artificial:</strong> BE PELICAN también podrá utilizar herramientas de IA, machine learning o análisis de datos para fines como prevención del fraude, personalización de servicios, validación de identidad, ciberseguridad y mejora de productos. El titular podrá solicitar la revisión de decisiones automatizadas cuando la normativa lo permita.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "derechos",
    number: "7",
    title: "Derechos de los Titulares",
    icon: <UserCheck className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Como titular de los Datos Personales, usted tiene derecho a:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: "✏️", title: "Conocer, actualizar y rectificar", desc: "Sus Datos Personales en cualquier momento." },
            { icon: "📋", title: "Solicitar prueba", desc: "De la autorización otorgada para el tratamiento." },
            { icon: "🔍", title: "Ser informado", desc: "Previa solicitud, del uso dado a sus Datos Personales." },
            { icon: "⚖️", title: "Presentar quejas", desc: "Ante la SIC por infracciones a la normativa." },
            { icon: "🚫", title: "Revocar autorización", desc: "Y/o solicitar la supresión de los datos, cuando proceda." },
            { icon: "🆓", title: "Acceso gratuito", desc: "A sus Datos Personales objeto de tratamiento." },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <p className="font-medium text-foreground text-sm">{item.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "procedimiento",
    number: "8",
    title: "Procedimiento para Ejercer sus Derechos",
    icon: <HelpCircle className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="como" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              ¿Puedo consultar, actualizar, rectificar y suprimir mis Datos Personales?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              <strong className="text-foreground">Sí.</strong> Puede hacerlo en cualquier momento y sin costo, conforme a la ley, enviando una comunicación a <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="quien" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              ¿Quién puede hacerlo?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-1">
              <p>• El titular, acreditando su identidad.</p>
              <p>• Los causahabientes, acreditando dicha calidad.</p>
              <p>• El representante y/o apoderado del titular, acreditando la representación.</p>
              <p>• Un tercero autorizado legalmente.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tiempo" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              ¿Cuánto tiempo tarda la respuesta?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              La solicitud será atendida en un término máximo de <strong className="text-foreground">quince (15) días hábiles</strong>. Si no fuere posible atenderla dentro de dicho término, se informará al solicitante los motivos de la demora, la cual no podrá superar los <strong className="text-foreground">ocho (8) días hábiles</strong> adicionales.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="negar" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              ¿Puede BE PELICAN negar el acceso o supresión?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-1">
              <p>Sí, en los casos permitidos por la ley, por ejemplo:</p>
              <p>• Cuando el solicitante no sea el titular, causahabiente o representante debidamente acreditado.</p>
              <p>• Cuando exista un deber legal o contractual de conservar la información.</p>
              <p>• Cuando medie una causal legal que impida la supresión o revocatoria.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cobro" className="border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              ¿Puede cobrarme por acceder a mis Datos Personales?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Para consultas cuya periodicidad sea mayor a una por cada mes calendario, BE PELICAN podrá cobrar únicamente los gastos de envío, reproducción y certificación de documentos, sin exceder los costos de recuperación del material.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: "quejas",
    number: "9",
    title: "Procedimiento para Quejas y Reclamos",
    icon: <ClipboardList className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Si usted o sus causahabientes consideran que la información contenida en una base de datos debe ser corregida, actualizada o suprimida, podrán presentar un reclamo ante BE PELICAN S.A.S. B.I.C.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
          <p className="text-sm font-medium text-foreground">Su reclamo debe incluir:</p>
          <div className="grid grid-cols-2 gap-2">
            {["Identificación del solicitante", "Descripción de los hechos", "Medio de contacto para responder", "Documentos de soporte"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary">•</span>{item}
              </div>
            ))}
          </div>
          <p className="text-xs mt-2">
            Envíelo a: <a href="mailto:management@bepelican.com" className="text-primary font-medium">management@bepelican.com</a>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-primary">5</p>
            <p className="text-xs text-muted-foreground">días hábiles para requerir información incompleta</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-primary">2</p>
            <p className="text-xs text-muted-foreground">días hábiles para marcar "reclamo en trámite"</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-primary">15</p>
            <p className="text-xs text-muted-foreground">días hábiles máximo para respuesta</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sensibles",
    number: "10",
    title: "Datos Personales Sensibles",
    icon: <Lock className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          En caso de recolectar Datos Personales Sensibles, BE PELICAN S.A.S. B.I.C. se obliga a darles tratamiento conforme a la normativa aplicable.
        </p>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-2">
          <p className="text-sm font-medium text-foreground">En todo caso, se informará al titular:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary">•</span>Que no está obligado a autorizar su tratamiento.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span>Cuáles datos son sensibles y cuál es la finalidad.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span>Que ninguna actividad podrá condicionarse al suministro de Datos Personales Sensibles.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4 text-primary" />
            <p className="font-medium text-foreground text-sm">Datos de menores de edad</p>
          </div>
          <p className="text-xs text-muted-foreground">
            BE PELICAN no recolecta, en principio, datos de menores de edad. Si llegara a hacerlo, garantizará el respeto de sus derechos fundamentales, el interés superior del menor y el consentimiento expreso de sus representantes legales.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "transferencia",
    number: "11",
    title: "Transferencia de Datos Personales",
    icon: <Send className="h-5 w-5" />,
    content: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          En principio, BE PELICAN no transfiere información personal a terceros ni autoriza su uso por terceros, salvo cuando sea necesario para cumplir obligaciones contractuales, legales, corporativas, administrativas o de recursos humanos.
        </p>
        <p>
          Cuando corresponda, BE PELICAN podrá suscribir contratos de transmisión o transferencia de datos con terceros, exigiendo condiciones de confidencialidad, seguridad y uso limitado a las finalidades autorizadas.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm font-medium text-foreground mb-2">La transferencia internacional podrá realizarse cuando:</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>El titular haya otorgado autorización expresa e inequívoca.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Sea necesaria por razones médicas o sanitarias.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Corresponda a transferencias bancarias o bursátiles.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Esté amparada en tratados internacionales.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Sea necesaria para la ejecución de un contrato con el titular.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Sea necesaria para la defensa de un derecho en proceso judicial.</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Sea exigida para la salvaguarda del interés público.</li>
          </ul>
        </div>
        <p>
          BE PELICAN podrá transferir Datos Personales a compañías afiliadas o a terceros no vinculados cuando sea necesario para cumplir obligaciones legales, contractuales o relacionadas con la línea de negocio.
        </p>
      </div>
    ),
  },
];

const PoliticaPrivacidad = () => {
  const [activeSection, setActiveSection] = useState("aviso");

  useEffect(() => {
    document.title = "Política de Privacidad - BePelican";
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveSection(id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BePelicanHeader />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protección de datos
            </div>
            <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Política de Manejo de Datos Personales</h1>
            <p className="text-muted-foreground">
              BE PELICAN S.A.S. B.I.C. — Aviso de Protección de Datos Personales
            </p>
          </div>

          <div className="flex gap-10">
            {/* Sidebar — desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Contenido</p>
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <nav className="space-y-1 pr-4">
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={cn(
                          "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          activeSection === s.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <span className="shrink-0 opacity-70">{s.icon}</span>
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <Accordion type="multiple" defaultValue={["aviso"]} className="w-full space-y-3">
                {sections.map((s) => (
                  <AccordionItem
                    key={s.id}
                    value={s.id}
                    id={`section-${s.id}`}
                    className="rounded-xl border border-border bg-card px-5 scroll-mt-28"
                  >
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                          {s.icon}
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Sección {s.number}</span>
                          <p className="text-sm sm:text-base font-semibold text-foreground">{s.title}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2">{s.content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Footer note */}
              <div className="border-t border-border pt-6 mt-10 text-center">
                <p className="text-xs text-muted-foreground">
                  Esta política deberá ser revisada por lo menos cada 2 años. BE PELICAN S.A.S. B.I.C. se reserva el derecho de modificar su contenido para reflejar cambios legislativos, técnicos o de la industria.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BePelicanFooter />
    </div>
  );
};

export default PoliticaPrivacidad;
