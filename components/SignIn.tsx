import React, { useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { ViewState } from '../types';

interface SignInProps {
  onNavigate: (view: ViewState) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const signupEmail = sessionStorage.getItem('signupEmail');
    const signupSuccess = sessionStorage.getItem('signupSuccess');

    if (signupEmail) {
      setEmail(signupEmail);
      sessionStorage.removeItem('signupEmail');
    }

    if (signupSuccess) {
      setSuccessMessage("Votre compte a été créé. Veuillez vérifier votre email et confirmer votre compte avant de vous connecter.");
      sessionStorage.removeItem('signupSuccess');
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      onNavigate('dashboard');
    } else {
      // Should ideally not happen if no error, but safe fallback
      setError("Erreur lors de la connexion. Veuillez réessayer.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connexion</h2>
        
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-brand-600 hover:underline font-medium"
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};
