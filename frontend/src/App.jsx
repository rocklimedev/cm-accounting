import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Router from "@/router/Router";
import { AuthProvider } from "./store/use-auth";
function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
