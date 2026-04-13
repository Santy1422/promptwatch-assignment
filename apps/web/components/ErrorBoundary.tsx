import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="mb-6 rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
