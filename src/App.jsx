import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./routes/router";

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
