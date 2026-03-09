import ImportadorSped from './ImportadorSped';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <ImportadorSped />
      </div>
    </AuthProvider>
  );
}

export default App;