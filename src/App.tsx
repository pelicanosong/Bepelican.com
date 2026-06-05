import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DisplayCurrencyProvider } from "@/contexts/DisplayCurrencyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageLoader from "@/components/PageLoader";
import ScrollToTop from "@/components/ScrollToTop";
import { queryClient } from "@/lib/queryClient";
import { ExperienciaRedirect, AuthRedirect } from "@/components/LegacyRedirect";

const BePelicanHome = lazy(() => import("@/pages/BePelicanHome"));
const Experiencias = lazy(() => import("@/pages/Experiencias"));
const ExperienciaDetalle = lazy(() => import("@/pages/ExperienciaDetalle"));
const ExperienciaCheckout = lazy(() => import("@/pages/ExperienciaCheckout"));
const PagoResultado = lazy(() => import("@/pages/PagoResultado"));
const Auth = lazy(() => import("@/pages/Auth"));
const MiCuenta = lazy(() => import("@/pages/MiCuenta"));
const Admin = lazy(() => import("@/pages/Admin"));
const Bitacora = lazy(() => import("@/pages/Bitacora"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PoliticaPrivacidad = lazy(() => import("@/pages/PoliticaPrivacidad"));
const TerminosCondiciones = lazy(() => import("@/pages/TerminosCondiciones"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <DisplayCurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<BePelicanHome />} />

                  {/* Auth */}
                  <Route path="/login" element={<Auth />} />
                  <Route path="/registro" element={<Auth />} />
                  <Route path="/auth" element={<AuthRedirect />} />

                  {/* Experiencias */}
                  <Route path="/experiencias" element={<Experiencias />} />
                  <Route path="/experiencias/:slug" element={<ExperienciaDetalle />} />
                  <Route path="/experiencia/:slug" element={<ExperienciaRedirect />} />

                  {/* Biblioteca */}
                  <Route path="/biblioteca" element={<Bitacora />} />
                  <Route path="/biblioteca/:slug" element={<Bitacora />} />
                  <Route path="/libreria" element={<Bitacora />} />
                  <Route path="/libreria/:slug" element={<Bitacora />} />

                  {/* Checkout */}
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <ExperienciaCheckout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout/resultado"
                    element={
                      <ProtectedRoute>
                        <PagoResultado />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/experiencia-checkout" element={<Navigate to="/checkout" replace />} />
                  <Route path="/pago-resultado" element={<Navigate to="/checkout/resultado" replace />} />

                  {/* Mi Cuenta */}
                  <Route
                    path="/mi-cuenta"
                    element={
                      <ProtectedRoute>
                        <MiCuenta />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/privacidad" element={<PoliticaPrivacidad />} />
                  <Route path="/terminos" element={<TerminosCondiciones />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
        </DisplayCurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
