import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, MapPin, Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import logoPrimary from '@/assets/logo-primary.png';
import { countryCodes } from '@/lib/countryCodes';
import { CountryCodeSelector } from '@/components/ui/country-code-selector';

const emailSchema = z.string().email('Correo electrónico inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const nameSchema = z.string().min(2, 'El nombre debe tener al menos 2 caracteres');
const phoneSchema = z.string().min(7, 'Número de teléfono inválido').max(15, 'Número demasiado largo');

type AuthMode = 'login' | 'register' | 'forgot-password' | 'registration-complete' | 'reset-sent';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialMode: AuthMode = location.pathname === '/registro' ? 'register' : 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+57');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; firstName?: string; lastName?: string; phone?: string }>({});
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { signIn, signUp, signInWithGoogle, user, loading, resendConfirmationEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectParam = searchParams.get('redirect');
  const from =
    redirectParam ||
    location.state?.from?.pathname ||
    (location.pathname === '/registro' ? '/mi-cuenta?setup=1' : '/mi-cuenta');

  useEffect(() => {
    setMode(location.pathname === '/registro' ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Handle cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateForm = (checkPassword = true) => {
    const newErrors: { email?: string; password?: string; firstName?: string; lastName?: string; phone?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    if (checkPassword) {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }

    if (mode === 'register') {
      try {
        nameSchema.parse(firstName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.firstName = e.errors[0].message;
        }
      }
      try {
        nameSchema.parse(lastName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.lastName = e.errors[0].message;
        }
      }
      try {
        phoneSchema.parse(phone);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot-password') {
      if (!validateForm(false)) return;
      setIsSubmitting(true);
      
      try {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message
          });
        } else {
          setRegisteredEmail(email);
          setMode('reset-sent');
          toast({
            title: 'Correo enviado',
            description: 'Revisa tu bandeja de entrada para restablecer tu contraseña',
            duration: 10000,
          });
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              variant: 'destructive',
              title: 'Error de inicio de sesión',
              description: 'Correo o contraseña incorrectos'
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              variant: 'destructive',
              title: 'Correo no confirmado',
              description: 'Por favor confirma tu correo antes de iniciar sesión'
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: error.message
            });
          }
        } else {
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente'
          });
        }
      } else if (mode === 'register') {
        const fullPhone = `${countryCode}${phone}`;
        const { error } = await signUp(email, password, firstName, lastName, fullPhone);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Error de registro',
              description: 'Este correo ya está registrado'
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: error.message
            });
          }
        } else {
          setRegisteredEmail(email);
          setMode('registration-complete');
          toast({
            title: '¡Registro exitoso!',
            description: 'Por favor revisa tu correo para confirmar tu cuenta',
            duration: 10000,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const { error } = await resendConfirmationEmail(registeredEmail);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message
        });
      } else {
        toast({
          title: 'Correo reenviado',
          description: 'Revisa tu bandeja de entrada y carpeta de spam',
          duration: 8000,
        });
        setResendCooldown(60); // 60 second cooldown
      }
    } finally {
      setIsResending(false);
    }
  };

  const resetToLogin = () => {
    setMode('login');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setCountryCode('+57');
    setErrors({});
    setRegisteredEmail('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderSuccessScreen = (title: string, message: string, emailLabel: string) => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="font-display text-3xl text-foreground mb-4">
        {title}
      </h1>
      <div className="bg-muted/50 rounded-lg p-6 mb-6">
        <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
        <p className="text-foreground font-medium mb-2">
          Revisa tu correo electrónico
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          {emailLabel}
        </p>
        <p className="text-primary font-medium">{registeredEmail}</p>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Si no lo encuentras, revisa tu carpeta de spam.
      </p>
      
      {mode === 'registration-complete' && (
        <Button 
          variant="outline"
          onClick={handleResendEmail}
          disabled={isResending || resendCooldown > 0}
          className="mb-4 w-full"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reenviando...
            </>
          ) : resendCooldown > 0 ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reenviar en {resendCooldown}s
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reenviar correo de confirmación
            </>
          )}
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        onClick={resetToLogin}
        className="w-full"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a iniciar sesión
      </Button>
    </div>
  );

  const renderForm = () => (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {mode === 'login' && 'Bienvenido de vuelta'}
          {mode === 'register' && 'Crea tu cuenta'}
          {mode === 'forgot-password' && 'Recupera tu contraseña'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'login' && 'Ingresa tus credenciales para continuar'}
          {mode === 'register' && 'Únete a BePelican y descubre experiencias únicas'}
          {mode === 'forgot-password' && 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="phone">Celular</Label>
            <div className="flex gap-2">
              <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="3001234567"
                className={errors.phone ? 'border-destructive' : ''}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {mode !== 'forgot-password' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Contraseña</Label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrors({});
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'login' && 'Iniciando sesión...'}
              {mode === 'register' && 'Registrando...'}
              {mode === 'forgot-password' && 'Enviando...'}
            </>
          ) : (
            <>
              {mode === 'login' && 'Iniciar sesión'}
              {mode === 'register' && 'Crear cuenta'}
              {mode === 'forgot-password' && 'Enviar enlace de recuperación'}
            </>
          )}
        </Button>

        {mode !== 'forgot-password' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { error } = await signInWithGoogle();
                if (error) {
                  toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message
                  });
                }
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {mode === 'login' ? 'Iniciar sesión con Google' : 'Registrarse con Google'}
            </Button>
          </>
        )}
      </form>

      {/* Toggle */}
      <div className="mt-6 text-center">
        {mode === 'forgot-password' ? (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrors({});
            }}
            className="text-primary hover:underline font-medium flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a iniciar sesión
          </button>
        ) : (
          <p className="text-muted-foreground">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                const target = mode === 'login' ? '/registro' : '/login';
                const query = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';
                navigate(`${target}${query}`);
                setErrors({});
              }}
              className="ml-2 text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <a href="/" className="inline-block">
              <img src={logoPrimary} alt="BePelican" className="h-12" />
            </a>
          </div>

          {mode === 'registration-complete' && renderSuccessScreen(
            '¡Registro exitoso!',
            'Haz clic en el enlace del correo para activar tu cuenta.',
            'Enviamos un enlace de confirmación a:'
          )}
          
          {mode === 'reset-sent' && renderSuccessScreen(
            'Correo enviado',
            'Haz clic en el enlace del correo para crear una nueva contraseña.',
            'Enviamos un enlace de recuperación a:'
          )}
          
          {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && renderForm()}
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-bepelican-deepblue opacity-90" />
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Turismo de transformación</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-6">
              Descubre Colombia como nunca antes
            </h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Experiencias auténticas que conectan viajeros con las comunidades locales. 
              Vive aventuras únicas mientras apoyas el turismo sostenible.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-bepelican-orange/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-48 h-48 bg-bepelican-green/20 rounded-full blur-2xl" />
      </div>
    </div>
  );
};

export default Auth;
