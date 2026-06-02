import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold">Algo salió mal</h1>
            <p className="text-muted-foreground">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <Button onClick={() => window.location.reload()}>Recargar</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
