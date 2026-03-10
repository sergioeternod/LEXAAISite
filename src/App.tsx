import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  Settings, 
  FileText, 
  Activity, 
  ShieldAlert, 
  BookOpen,
  ChevronRight,
  Filter,
  Download,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Send,
  Loader2,
  MessageSquare,
  X,
  BarChart2,
  TrendingUp,
  LogOut,
  Bookmark,
  Star,
  UserCircle,
  Download as DownloadIcon,
  FileDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { expedientes, alertas, kpis, votaciones, resumenesSemanales, legisladores } from './data/mockData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const COLORS = ['#B3282D', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedExpediente, setSelectedExpediente] = useState<any>(null);
  const [selectedVote, setSelectedVote] = useState<any>(null);
  const [filterParty, setFilterParty] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Explore Mode State
  const [exploreMode, setExploreMode] = useState<'expedientes' | 'legisladores'>('expedientes');
  const [selectedLegislator, setSelectedLegislator] = useState<any>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Auth & User State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [savedExpedientes, setSavedExpedientes] = useState<string[]>([]);
  const [savedLegisladores, setSavedLegisladores] = useState<string[]>([]);

  // AI Search State
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              history: [],
              interests: [],
              savedExpedientes: [],
              savedLegisladores: []
            });
          } else {
            const data = userSnap.data();
            setUserHistory(data.history || []);
            setSavedExpedientes(data.savedExpedientes || []);
            setSavedLegisladores(data.savedLegisladores || []);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserHistory([]);
        setSavedExpedientes([]);
        setSavedLegisladores([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const trackHistory = async (type: string, query: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newEntry = {
        type,
        query,
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        history: arrayUnion(newEntry)
      });
      setUserHistory(prev => [...prev, newEntry]);
    } catch (error) {
      console.error("Error tracking history", error);
    }
  };

  const trackInterest = async (topic: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        interests: arrayUnion(topic)
      });
    } catch (error) {
      console.error("Error tracking interest", error);
    }
  };

  const toggleSaveExpediente = async (id: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const isSaved = savedExpedientes.includes(id);
    const newSaved = isSaved 
      ? savedExpedientes.filter(e => e !== id) 
      : [...savedExpedientes, id];
    
    setSavedExpedientes(newSaved);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { savedExpedientes: newSaved });
    } catch (error) {
      console.error("Error saving expediente", error);
    }
  };

  const toggleSaveLegislador = async (id: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const isSaved = savedLegisladores.includes(id);
    const newSaved = isSaved 
      ? savedLegisladores.filter(l => l !== id) 
      : [...savedLegisladores, id];
    
    setSavedLegisladores(newSaved);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { savedLegisladores: newSaved });
    } catch (error) {
      console.error("Error saving legislador", error);
    }
  };

  const exportToCSV = (data: any, filename: string) => {
    // Basic CSV export
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${headers}\n${values}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSummaryToPDF = () => {
    window.print();
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    trackHistory('search', searchQuery);
    setCurrentView('explorar');

    // Detect if the query is a question or natural language prompt
    const lowerQuery = searchQuery.toLowerCase().trim();
    const isQuestion = lowerQuery.includes('?') || lowerQuery.includes('¿');
    const questionWords = ['qué', 'que', 'cómo', 'como', 'cuándo', 'cuando', 'quién', 'quien', 'por qué', 'por que', 'cuál', 'cual', 'cuánto', 'cuanto', 'analiza', 'resume', 'dime', 'explica', 'opinión', 'opinion'];
    const startsWithQuestionWord = questionWords.some(word => lowerQuery.startsWith(word));
    const isLongPhrase = lowerQuery.split(' ').length > 4;

    if (isQuestion || startsWithQuestionWord || isLongPhrase) {
      handleAiSearch();
    } else {
      setIsAiSearchActive(false);
      setAiSearchResults(null);
    }
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearchActive(true);
    setIsAiSearchLoading(true);
    setAiSearchResults(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Actúa como un analista legislativo experto del Congreso del Estado de México (Edomex). Analiza las versiones estenográficas (simuladas basadas en tu conocimiento general) sobre el tema legal o palabra clave: '${searchQuery}'. Identifica las opiniones de los diputados locales participantes respecto a este tema, prestando especial atención a la bancada de Morena liderada por Francisco Vázquez si es relevante al tema. Excluye estrictamente cualquier insulto, ataque político o alusión personal. Presenta un resumen estructurado con el nombre del legislador, su partido (si es posible) y su postura u opinión argumentativa sobre el tema. Usa formato Markdown.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiSearchResults(response.text || "No se pudo generar un análisis.");
    } catch (error) {
      console.error("Error generating AI search:", error);
      setAiSearchResults("Hubo un error al generar el análisis. Por favor, intenta de nuevo.");
    } finally {
      setIsAiSearchLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExpediente) {
      trackHistory('view_expediente', selectedExpediente.clave_oficial);
      setChatMessages([{
        role: 'model',
        text: `Hola, soy LEXA. Estoy lista para responder tus dudas sobre el expediente ${selectedExpediente.clave_oficial}. ¿Qué te gustaría saber sobre su impacto, contexto o actores involucrados?`
      }]);
      setChatInput('');
    }
  }, [selectedExpediente]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedExpediente) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `Eres LEXA AI, un asistente experto en inteligencia legislativa enfocado en el Congreso del Estado de México (Edomex). 
      Estás ayudando a un usuario a analizar el siguiente expediente legislativo local:
      Título: ${selectedExpediente.titulo}
      Clave: ${selectedExpediente.clave_oficial}
      Estado: ${selectedExpediente.estado_actual}
      Tema: ${selectedExpediente.tema_principal}
      Descripción: ${selectedExpediente.descripcion}
      Resumen Ejecutivo: ${selectedExpediente.resumen_ia.ejecutivo}
      Evidencia clave: ${selectedExpediente.resumen_ia.evidencia.map((e: any) => e.texto).join(" | ")}
      
      Responde a las preguntas del usuario basándote en esta información. Sé profesional, analítico, objetivo y conciso. Considera el contexto político del Estado de México y sus principales actores (como Francisco Vázquez, coordinador de Morena) si es relevante. Si te preguntan algo fuera del contexto de este expediente, indícalo cortésmente.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      setChatMessages(prev => [...prev, { role: 'model', text: response.text || 'No pude generar una respuesta.' }]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Ocurrió un error al consultar a LEXA AI. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderTopNav = () => (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 relative">
      <div className="flex items-center space-x-1 transform scale-y-[0.8] scale-x-[1.1] origin-left w-32">
        <span className="text-2xl font-black text-[#333C45] tracking-tighter">LEXA</span>
        <span className="text-2xl font-black bg-gradient-to-r from-[#FF8B53] to-[#EB577A] text-transparent bg-clip-text tracking-tighter">AI</span>
      </div>
      
      <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-8">
        <button 
          onClick={() => { setCurrentView('dashboard'); setSelectedExpediente(null); }}
          className={`font-medium text-sm transition-colors ${currentView === 'dashboard' ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
          Panel
        </button>
        <button 
          onClick={() => { setCurrentView('explorar'); setSelectedExpediente(null); }}
          className={`font-medium text-sm transition-colors ${currentView === 'explorar' ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
          Historial
        </button>
        <button 
          onClick={() => { setCurrentView('alertas'); setSelectedExpediente(null); }}
          className={`font-medium text-sm transition-colors flex items-center space-x-1.5 ${currentView === 'alertas' ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
          <span>Alertas</span>
          <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#8B1A1A] rounded-full">
            2
          </span>
        </button>
      </nav>

      <div className="flex items-center space-x-4 w-auto justify-end">
        <a 
          href="https://www.congresoedomex.gob.mx/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:flex items-center px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <img 
            src="https://www.congresoedomex.gob.mx/storage/images/IMAGOTIPOHorizontal.png" 
            alt="Congreso Estado de México" 
            className="h-12 object-contain"
            referrerPolicy="no-referrer"
          />
        </a>

        {user ? (
          <div className="flex items-center space-x-3 group relative">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
              <img src={user.photoURL || "https://picsum.photos/seed/user/100/100"} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={() => { setCurrentView('perfil'); setSelectedExpediente(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors">
                <UserCircle className="w-4 h-4" />
                <span>Mi Perfil</span>
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 rounded-b-xl transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleLogin} className="text-sm font-medium text-[#8B1A1A] hover:text-[#701515] transition-colors whitespace-nowrap">
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );

  const renderDashboard = () => (
    <div className="space-y-12 max-w-5xl mx-auto pt-8 pb-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
          Explora el historial legislativo con inteligencia artificial
        </h1>
        
        <div className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center w-full h-14 rounded-full bg-white shadow-lg border border-slate-100 overflow-hidden pl-6 pr-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Busca por tema, legislador o palabra clave..."
              className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 text-slate-700 placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch} className="h-10 px-6 bg-[#8B1A1A] hover:bg-[#701515] text-white font-medium rounded-full transition-colors whitespace-nowrap">
              Consultar
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button onClick={() => { setSearchQuery('Ley del ISSEMyM'); trackInterest('Ley del ISSEMyM'); handleSearch(); }} className="px-4 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-[#8B1A1A] hover:text-[#8B1A1A] transition-colors bg-white">
              #LeyDelISSEMyM
            </button>
            <button onClick={() => { setSearchQuery('Paquete Fiscal 2026'); trackInterest('Paquete Fiscal 2026'); handleSearch(); }} className="px-4 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-[#8B1A1A] hover:text-[#8B1A1A] transition-colors bg-white">
              #PaqueteFiscal2026
            </button>
            <button onClick={() => { setSearchQuery('Gestión del Agua'); trackInterest('Gestión del Agua'); handleSearch(); }} className="px-4 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-[#8B1A1A] hover:text-[#8B1A1A] transition-colors bg-white">
              #GestiónDelAgua
            </button>
            <button onClick={() => { setSearchQuery('Movilidad Edomex'); trackInterest('Movilidad Edomex'); handleSearch(); }} className="px-4 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-[#8B1A1A] hover:text-[#8B1A1A] transition-colors bg-white">
              #MovilidadEdomex
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Última votación relevante</h3>
              <div className="p-2 bg-slate-50 rounded-lg">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <p className="text-sm text-slate-900 font-medium mb-4 line-clamp-2">
              Reforma al Artículo 4 Constitucional en materia de bienestar
            </p>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-emerald-600">68%</div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">A FAVOR</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Aprobada</h3>
              <div className="p-2 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Iniciativa con proyecto de decreto por el que se expide la Ley General de Aguas
            </p>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-slate-900">82%</div>
            <div className="text-xs font-medium text-slate-500">Consenso</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tendencias</h3>
            <div className="p-2 bg-slate-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#8B1A1A]" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 w-4">1</span>
                <span className="text-sm font-medium text-slate-700">Energía Renovable</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">+24%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 w-4">2</span>
                <span className="text-sm font-medium text-slate-700">Ciberseguridad</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">+18%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 w-4">3</span>
                <span className="text-sm font-medium text-slate-700">Movilidad Urbana</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tu Actividad Reciente (Solo usuarios registrados) */}
      {user && userHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#8B1A1A]" />
              Tu Actividad Reciente
            </h3>
            <button 
              onClick={() => setCurrentView('explorar')}
              className="text-sm font-medium text-[#8B1A1A] hover:text-[#701515] transition-colors"
            >
              Ver todo el historial
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userHistory.slice().reverse().slice(0, 4).map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setSearchQuery(item.query);
                  handleSearch();
                }}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-[#8B1A1A]/30 transition-all cursor-pointer group flex flex-col justify-between h-32"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${item.type === 'search' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {item.type === 'search' ? <Search className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {item.type === 'search' ? 'Búsqueda' : 'Expediente'}
                  </p>
                  <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-[#8B1A1A] transition-colors">
                    {item.query}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Actividad Legislativa (Últimos 4 meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.actividadMensual} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="iniciativas" name="Iniciativas" fill="#B3282D" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="dictamenes" name="Dictámenes" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Distribución por Sector</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.sectoresTop}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {kpis.sectoresTop.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Votaciones Recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Votaciones Recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['En Debate', 'Aprobada', 'Rechazada'].map((estado) => (
            <div key={estado} className="space-y-4">
              <div className={`flex items-center space-x-2 pb-2 border-b-2 ${
                estado === 'Aprobada' ? 'border-emerald-500' : 
                estado === 'Rechazada' ? 'border-red-500' : 
                'border-amber-500'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  estado === 'Aprobada' ? 'bg-emerald-500' : 
                  estado === 'Rechazada' ? 'bg-red-500' : 
                  'bg-amber-500'
                }`} />
                <h4 className="font-semibold text-slate-700">{estado}</h4>
              </div>
              
              <div className="space-y-3">
                {votaciones
                  .filter(v => v.estado === estado)
                  .map(voto => (
                    <div 
                      key={voto.id} 
                      onClick={() => setSelectedVote(voto)}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 group-hover:border-morena-200 transition-colors">{voto.expediente}</span>
                        <span className="text-xs text-slate-400">{voto.fecha}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-3 line-clamp-2 group-hover:text-morena-600 transition-colors">{voto.titulo}</p>
                      
                      {estado !== 'En Debate' && (
                        <div className="flex items-center space-x-1 text-xs">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                            <div style={{ width: `${(voto.votos_favor / voto.total_votos) * 100}%` }} className="bg-emerald-500 h-full" />
                            <div style={{ width: `${(voto.votos_contra / voto.total_votos) * 100}%` }} className="bg-red-500 h-full" />
                            <div style={{ width: `${(voto.abstenciones / voto.total_votos) * 100}%` }} className="bg-slate-400 h-full" />
                          </div>
                        </div>
                      )}
                      
                      {estado !== 'En Debate' && (
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span className="text-emerald-600 font-medium">{voto.votos_favor} Favor</span>
                          <span className="text-red-600 font-medium">{voto.votos_contra} Contra</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {votaciones.filter(v => v.estado === estado).length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      No hay votaciones recientes en este estado
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen Legislativo Semanal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-morena-50 rounded-lg">
            <Bot className="w-6 h-6 text-morena-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Resumen Legislativo Semanal (IA)</h3>
            <p className="text-sm text-slate-500">Generado automáticamente por LEXA AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {resumenesSemanales.map((resumen, idx) => (
            <div key={idx} className={`relative p-6 rounded-2xl ${idx === 0 ? 'bg-morena-50/50 border border-morena-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${idx === 0 ? 'bg-morena-100 text-morena-700' : 'bg-slate-200 text-slate-600'}`}>
                  {idx === 0 ? 'En Curso' : 'Pasada'}
                </span>
              </div>
              
              <h4 className="text-base font-semibold text-slate-900 mb-1">{resumen.periodo}</h4>
              <div className="h-1 w-12 bg-morena-500 rounded-full mb-4 opacity-20"></div>
              
              <p className="text-slate-700 text-sm leading-relaxed mb-6">
                {resumen.resumen}
              </p>
              
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Puntos Clave</h5>
                <ul className="space-y-2">
                  {resumen.puntos_clave.map((punto, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-morena-400 mt-1.5 flex-shrink-0" />
                      <span>{punto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900">Últimos Expedientes Actualizados</h3>
          <button onClick={() => setCurrentView('explorar')} className="text-sm font-medium text-morena-600 hover:text-morena-700">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Folio</th>
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Tema</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expedientes.slice(0, 3).map((exp) => (
                <tr key={exp.id} onClick={() => setSelectedExpediente(exp)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                  <td className="p-4 font-mono text-sm font-medium text-slate-900">{exp.clave_oficial}</td>
                  <td className="p-4 text-sm text-slate-700 font-medium group-hover:text-morena-600 transition-colors line-clamp-1 max-w-md">{exp.titulo}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-morena-50 text-morena-700">
                      {exp.tema_principal}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {exp.estado_actual}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${
                      exp.impacto_score >= 80 ? 'bg-red-50 text-red-700' :
                      exp.impacto_score >= 60 ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {exp.impacto_score}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExplorar = () => {
    const filteredExpedientes = expedientes.filter(e => 
      e.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clave_oficial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tema_principal.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredLegisladores = legisladores.filter(l => 
      l.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.partido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.estado.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Historial Legislativo</h1>
            <p className="text-slate-500 mt-2">Busca iniciativas, dictámenes y legisladores con inteligencia semántica.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setExploreMode('expedientes')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${exploreMode === 'expedientes' ? 'bg-white text-[#8B1A1A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Expedientes
            </button>
            <button 
              onClick={() => setExploreMode('legisladores')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${exploreMode === 'legisladores' ? 'bg-white text-[#8B1A1A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Legisladores
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={exploreMode === 'expedientes' ? "Buscar por tema, palabra clave o folio..." : "Buscar por nombre, partido o estado..."}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="flex items-center space-x-2 bg-white border border-slate-200 px-6 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>

        {user && userHistory.length > 0 && !searchQuery && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 font-medium mr-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" /> Búsquedas recientes:
            </span>
            {Array.from(new Set(userHistory.filter(h => h.type === 'search').map(h => h.query))).slice(-5).reverse().map((query, idx) => (
              <button 
                key={idx}
                onClick={() => { setSearchQuery(query as string); handleSearch(); }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-colors"
              >
                {query as string}
              </button>
            ))}
          </div>
        )}

        {searchQuery.trim() && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                  Análisis de Opiniones con IA
                </h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Analiza versiones estenográficas para identificar las posturas de los legisladores sobre "{searchQuery}", excluyendo alusiones personales.
                </p>
              </div>
              <button 
                onClick={handleAiSearch}
                disabled={isAiSearchLoading}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isAiSearchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Análisis</span>
                  </>
                )}
              </button>
            </div>
            
            {aiSearchResults && (
              <div className="mt-6 bg-white rounded-xl p-6 border border-indigo-100 shadow-inner">
                <div className="prose prose-sm max-w-none text-slate-700">
                  <Markdown>{aiSearchResults}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}

        {exploreMode === 'expedientes' ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Folio / Fecha</div>
              <div className="col-span-5">Título y Resumen</div>
              <div className="col-span-2">Tema / Sector</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Riesgo</div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredExpedientes.map(exp => (
                <div 
                  key={exp.id} 
                  onClick={() => setSelectedExpediente(exp)}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors items-center group"
                >
                  <div className="col-span-2">
                    <div className="font-mono text-sm font-medium text-slate-900">{exp.clave_oficial}</div>
                    <div className="text-xs text-slate-500 mt-1">{exp.fecha_inicio}</div>
                  </div>
                  <div className="col-span-5 pr-4">
                    <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-[#8B1A1A] transition-colors">{exp.titulo}</div>
                    <div className="text-sm text-slate-500 mt-1 line-clamp-1">{exp.descripcion}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[#8B1A1A]">
                      {exp.tema_principal}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {exp.estado_actual}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                      exp.impacto_score >= 80 ? 'bg-red-50 text-red-700' :
                      exp.impacto_score >= 60 ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {exp.impacto_score}
                    </div>
                  </div>
                </div>
              ))}
              {filteredExpedientes.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No se encontraron expedientes que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLegisladores.map(leg => (
              <div 
                key={leg.id}
                onClick={() => setSelectedLegislator(leg)}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: leg.color }}></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500" style={{ color: leg.color, backgroundColor: `${leg.color}15` }}>
                      {leg.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#8B1A1A] transition-colors">{leg.nombre}</h3>
                      <p className="text-sm text-slate-500">{leg.partido} • {leg.estado}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Asistencia</div>
                    <div className="text-lg font-bold text-slate-900">{leg.asistencia}%</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Lealtad</div>
                    <div className="text-lg font-bold text-slate-900">{leg.lealtad}%</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <span className="font-semibold">Comisiones:</span> {leg.comisiones.join(", ")}
                </div>
              </div>
            ))}
            {filteredLegisladores.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
                No se encontraron legisladores que coincidan con la búsqueda.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExpedienteDetail = () => {
    if (!selectedExpediente) return null;
    const exp = selectedExpediente;
    const isSaved = savedExpedientes.includes(exp.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
          <button onClick={() => setSelectedExpediente(null)} className="hover:text-[#8B1A1A] transition-colors">Explorar</button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-slate-900">{exp.clave_oficial}</span>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="font-mono text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{exp.clave_oficial}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[#8B1A1A]">
                  {exp.tema_principal}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {exp.estado_actual}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight max-w-3xl">{exp.titulo}</h1>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => toggleSaveExpediente(exp.id)}
                  className={`px-4 py-2 rounded-xl border transition-all shadow-sm flex items-center space-x-2 text-sm font-medium ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'Guardado' : 'Guardar Expediente'}</span>
                </button>
                <button onClick={() => exportToCSV(exp, `expediente_${exp.clave_oficial}`)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2 text-sm font-medium">
                  <FileDown className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </button>
                <button onClick={exportSummaryToPDF} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2 text-sm font-medium">
                  <DownloadIcon className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm font-medium text-slate-500 mb-1">Impacto Regulatorio</div>
              <div className={`text-3xl font-bold ${
                exp.impacto_score >= 80 ? 'text-red-600' :
                exp.impacto_score >= 60 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {exp.impacto_score}<span className="text-lg text-slate-400 font-normal">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-8 border-t border-slate-100 pt-8">
            <div className="col-span-2 space-y-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#8B1A1A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Resumen IA (Ejecutivo)</h3>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-slate-700 leading-relaxed">{exp.resumen_ia.ejecutivo}</p>
                  
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evidencia Extraída (NLP)</h4>
                    <div className="space-y-3">
                      {exp.resumen_ia.evidencia.map((ev, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-slate-600 italic">"{ev.texto}"</p>
                            <span className="text-xs font-mono text-slate-400 mt-1 block">Ref: {ev.chunk_id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Timeline Legislativo</h3>
                </div>
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                  {exp.eventos.map((evento, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                      <div className="text-sm font-medium text-blue-600 mb-0.5">{evento.fecha}</div>
                      <div className="text-base font-semibold text-slate-900">{evento.tipo}</div>
                      <div className="text-sm text-slate-500 mt-1">{evento.descripcion}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Section */}
              <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col h-[500px] chat-section">
                <div className="bg-[#8B1A1A] p-4 flex items-center space-x-3 text-white">
                  <Bot className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">LEXA AI - Asistente Legislativo</h3>
                    <p className="text-red-100 text-xs">Análisis contextual y raciocinio sobre este expediente</p>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4 flex flex-col">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#8B1A1A] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-3">
                        <Loader2 className="w-4 h-4 text-[#8B1A1A] animate-spin" />
                        <span className="text-sm font-medium text-slate-500">LEXA está analizando...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Pregunta sobre impactos, actores o contexto..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="bg-[#8B1A1A] text-white p-3 rounded-xl hover:bg-[#7A1315] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-slate-500" />
                  Actores Clave
                </h3>
                <div className="space-y-3">
                  {exp.actores.map((actor, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{actor.nombre}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500">{actor.rol}</span>
                        {actor.partido !== 'N/A' && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-medium text-slate-600">{actor.partido}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-slate-500" />
                  Documentos Originales
                </h3>
                <div className="space-y-2">
                  {exp.documentos.map((doc, idx) => (
                    <a key={idx} href={doc.url} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-[#8B1A1A]/30 transition-colors group">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#8B1A1A]" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-[#8B1A1A]">{doc.tipo}</span>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-[#8B1A1A]" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Sectores Afectados</h3>
                <div className="flex flex-wrap gap-2">
                  {exp.sectores_afectados.map((sector, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-600">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerfil = () => (
    <div className="space-y-8 max-w-4xl mx-auto w-full pb-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
          <p className="text-slate-500 mt-2">Gestiona tus preferencias, alertas y elementos guardados.</p>
        </div>
      </div>

      {!user ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inicia sesión para ver tu perfil</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Guarda expedientes, sigue a legisladores y configura alertas personalizadas sobre los temas que te interesan.</p>
          <button onClick={handleLogin} className="px-6 py-3 bg-[#8B1A1A] hover:bg-[#701515] text-white font-medium rounded-xl transition-colors shadow-sm">
            Iniciar Sesión con Google
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center space-x-6">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-slate-50 shadow-sm">
              <img src={user.photoURL || "https://picsum.photos/seed/user/200/200"} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.displayName || 'Usuario'}</h2>
              <p className="text-slate-500">{user.email}</p>
              <div className="mt-4 flex space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <Bookmark className="w-3 h-3 mr-1" /> {savedExpedientes.length} Expedientes
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                  <Star className="w-3 h-3 mr-1" /> {savedLegisladores.length} Legisladores
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saved Expedientes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Bookmark className="w-5 h-5 mr-2 text-[#8B1A1A]" />
                Expedientes Guardados
              </h3>
              {savedExpedientes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No tienes expedientes guardados aún.</p>
              ) : (
                <div className="space-y-3">
                  {savedExpedientes.map(id => {
                    const exp = expedientes.find(e => e.id === id);
                    if (!exp) return null;
                    return (
                      <div key={id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedExpediente(exp); setCurrentView('explorar'); }}>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-medium text-slate-500">{exp.clave_oficial}</span>
                          <button onClick={(e) => { e.stopPropagation(); toggleSaveExpediente(id); }} className="text-slate-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-slate-900 mt-1 line-clamp-2 group-hover:text-[#8B1A1A] transition-colors">{exp.titulo}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Legisladores */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-[#8B1A1A]" />
                Legisladores en Seguimiento
              </h3>
              {savedLegisladores.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No sigues a ningún legislador aún.</p>
              ) : (
                <div className="space-y-3">
                  {savedLegisladores.map(id => {
                    const leg = legisladores.find(l => l.id === id);
                    if (!leg) return null;
                    return (
                      <div key={id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group" onClick={() => { setSelectedLegislator(leg); setCurrentView('explorar'); setExploreMode('legisladores'); }}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            <img src={leg.avatar} alt={leg.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 group-hover:text-[#8B1A1A] transition-colors">{leg.nombre}</p>
                            <p className="text-xs text-slate-500">{leg.partido} • {leg.estado}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleSaveLegislador(id); }} className="text-slate-400 hover:text-red-500 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLegisladorDetail = () => {
    if (!selectedLegislator) return null;
    const isSaved = savedLegisladores.includes(selectedLegislator.id);

    return (
      <div className="space-y-6 max-w-5xl mx-auto w-full pb-16 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedLegislator(null)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-[#8B1A1A] transition-colors mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Volver a Legisladores
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-sm flex-shrink-0">
              <img src={selectedLegislator.foto} alt={selectedLegislator.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedLegislator.nombre}</h1>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                      {selectedLegislator.partido}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{selectedLegislator.estado}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{selectedLegislator.tipo}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => toggleSaveLegislador(selectedLegislator.id)}
                    className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center space-x-2 ${isSaved ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium hidden sm:inline">{isSaved ? 'Siguiendo' : 'Seguir'}</span>
                  </button>
                  <button onClick={() => exportToCSV(selectedLegislator, `legislador_${selectedLegislator.id}`)} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Asistencia</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedLegislator.asistencia}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Iniciativas</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedLegislator.iniciativas_presentadas}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aprobadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{selectedLegislator.iniciativas_aprobadas}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Comisiones</h3>
            <div className="flex flex-wrap gap-2">
              {selectedLegislator.comisiones.map((comision: string, idx: number) => (
                <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                  {comision}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAlertas = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centro de Alertas</h1>
          <p className="text-slate-500 mt-1">Notificaciones sobre cambios de estado, nuevos documentos y riesgos.</p>
        </div>
        <button className="text-sm font-medium text-[#8B1A1A] hover:text-[#7A1315]">Marcar todas como leídas</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {alertas.map(alerta => (
            <div key={alerta.id} className={`p-5 flex gap-4 ${alerta.leida ? 'bg-white' : 'bg-red-50/30'}`}>
              <div className="flex-shrink-0 mt-1">
                {alerta.severidad === 'alta' ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{alerta.tipo}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{alerta.expediente}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(alerta.fecha).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 mt-1 text-sm">{alerta.mensaje}</p>
                <div className="mt-3">
                  <button className="text-sm font-medium text-[#8B1A1A] hover:text-[#7A1315]">Ver expediente</button>
                </div>
              </div>
              {!alerta.leida && (
                <div className="w-2 h-2 rounded-full bg-[#8B1A1A] mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {renderTopNav()}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {currentView === 'dashboard' && !selectedExpediente && !selectedLegislator && renderDashboard()}
            {currentView === 'explorar' && !selectedExpediente && !selectedLegislator && renderExplorar()}
            {currentView === 'alertas' && !selectedExpediente && !selectedLegislator && renderAlertas()}
            {currentView === 'perfil' && !selectedExpediente && !selectedLegislator && renderPerfil()}
            {selectedExpediente && renderExpedienteDetail()}
            {selectedLegislator && renderLegisladorDetail()}
          </div>
        </div>
      </main>

      {/* Vote Details Modal */}
      {selectedVote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedVote.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700' : 
                    selectedVote.estado === 'Rechazada' ? 'bg-red-50 text-red-700' : 
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedVote.estado}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm text-slate-500">{selectedVote.fecha}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVote.titulo}</h2>
                <p className="text-sm text-slate-500 font-mono mt-1">{selectedVote.expediente}</p>
              </div>
              <button 
                onClick={() => setSelectedVote(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Video Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                  <h3 className="text-sm font-semibold text-slate-900">Canal del Congreso - Grabación de la Sesión</h3>
                </div>
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-lg">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={selectedVote.video_url} 
                    title="Video del Canal del Congreso" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Bot className="w-5 h-5 text-[#8B1A1A]" />
                  <h3 className="font-semibold text-red-900">Resumen del Debate (IA)</h3>
                </div>
                <p className="text-red-800 text-sm leading-relaxed">
                  {selectedVote.resumen_ia_votacion}
                </p>
              </div>

              {/* Voting Results */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Resultados de la Votación</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-1 h-4 bg-slate-200 rounded-full overflow-hidden mb-4">
                    <div style={{ width: `${(selectedVote.votos_favor / selectedVote.total_votos) * 100}%` }} className="bg-emerald-500 h-full" />
                    <div style={{ width: `${(selectedVote.votos_contra / selectedVote.total_votos) * 100}%` }} className="bg-red-500 h-full" />
                    <div style={{ width: `${(selectedVote.abstenciones / selectedVote.total_votos) * 100}%` }} className="bg-slate-400 h-full" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{selectedVote.votos_favor}</div>
                      <div className="text-xs font-medium text-slate-500 uppercase">A Favor</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{selectedVote.votos_contra}</div>
                      <div className="text-xs font-medium text-slate-500 uppercase">En Contra</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-500">{selectedVote.abstenciones}</div>
                      <div className="text-xs font-medium text-slate-400 uppercase">Abstenciones</div>
                    </div>
                  </div>

                  {/* Party Breakdown */}
                  {selectedVote.desglose_partidos && (
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Desglose por Partido</h4>
                      <div className="space-y-3">
                        {selectedVote.desglose_partidos.map((partido: any, idx: number) => (
                          <div key={idx} className="flex items-center text-sm">
                            <div className="w-16 font-semibold text-slate-700 flex items-center">
                              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: partido.color }}></div>
                              {partido.partido}
                            </div>
                            <div className="flex-1 flex items-center space-x-1 h-6 bg-slate-100 rounded overflow-hidden mx-2">
                              {partido.favor > 0 && (
                                <div 
                                  style={{ width: `${(partido.favor / (partido.favor + partido.contra + partido.abstencion)) * 100}%` }} 
                                  className="h-full bg-emerald-500/80 flex items-center justify-center text-[10px] text-white font-medium"
                                >
                                  {partido.favor}
                                </div>
                              )}
                              {partido.contra > 0 && (
                                <div 
                                  style={{ width: `${(partido.contra / (partido.favor + partido.contra + partido.abstencion)) * 100}%` }} 
                                  className="h-full bg-red-500/80 flex items-center justify-center text-[10px] text-white font-medium"
                                >
                                  {partido.contra}
                                </div>
                              )}
                              {partido.abstencion > 0 && (
                                <div 
                                  style={{ width: `${(partido.abstencion / (partido.favor + partido.contra + partido.abstencion)) * 100}%` }} 
                                  className="h-full bg-slate-400/80 flex items-center justify-center text-[10px] text-white font-medium"
                                >
                                  {partido.abstencion}
                                </div>
                              )}
                            </div>
                            <div className="w-12 text-right text-xs text-slate-500">
                              {partido.favor + partido.contra + partido.abstencion}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center space-x-4 mt-4 text-[10px] text-slate-400">
                        <div className="flex items-center"><div className="w-2 h-2 bg-emerald-500/80 rounded mr-1"></div> A favor</div>
                        <div className="flex items-center"><div className="w-2 h-2 bg-red-500/80 rounded mr-1"></div> En contra</div>
                        <div className="flex items-center"><div className="w-2 h-2 bg-slate-400/80 rounded mr-1"></div> Abstención</div>
                      </div>
                    </div>
                  )}

                  {/* Legislator List */}
                  {selectedVote.detalle_legisladores && selectedVote.detalle_legisladores.length > 0 && (
                    <div className="border-t border-slate-200 pt-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase">Detalle de Votos por Legislador</h4>
                        <select 
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20"
                          value={filterParty}
                          onChange={(e) => setFilterParty(e.target.value)}
                        >
                          <option value="Todos">Todos los Partidos</option>
                          <option value="Morena">Morena</option>
                          <option value="PAN">PAN</option>
                          <option value="PRI">PRI</option>
                          <option value="MC">MC</option>
                          <option value="PVEM">PVEM</option>
                          <option value="PT">PT</option>
                          <option value="PRD">PRD</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedVote.detalle_legisladores
                          .filter((l: any) => filterParty === 'Todos' || l.partido === filterParty)
                          .map((legislador: any, idx: number) => (
                          <div key={idx} className="flex items-center p-2 bg-white border border-slate-100 rounded-lg hover:border-red-100 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3" style={{ color: legislador.color, backgroundColor: `${legislador.color}15` }}>
                              {legislador.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{legislador.nombre}</p>
                              <p className="text-xs text-slate-500">{legislador.partido}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-medium ${
                              legislador.voto === 'favor' ? 'bg-emerald-50 text-emerald-700' :
                              legislador.voto === 'contra' ? 'bg-red-50 text-red-700' :
                              legislador.voto === 'abstencion' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {legislador.voto === 'favor' ? 'A Favor' :
                               legislador.voto === 'contra' ? 'En Contra' :
                               legislador.voto === 'abstencion' ? 'Abstención' : 'Pendiente'}
                            </div>
                          </div>
                        ))}
                        {selectedVote.detalle_legisladores.filter((l: any) => filterParty === 'Todos' || l.partido === filterParty).length === 0 && (
                          <div className="col-span-full text-center py-4 text-slate-400 text-sm italic">
                            No hay legisladores registrados para este filtro
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Legislator Detail Modal */}
      {selectedLegislator && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500" style={{ color: selectedLegislator.color, backgroundColor: `${selectedLegislator.color}15` }}>
                  {selectedLegislator.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedLegislator.nombre}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {selectedLegislator.partido}
                    </span>
                    <span className="text-sm text-slate-500">• {selectedLegislator.estado}</span>
                    <span className="text-sm text-slate-500">• {selectedLegislator.tipo_eleccion}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLegislator(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Asistencia</div>
                  <div className="text-2xl font-bold text-slate-900">{selectedLegislator.asistencia}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedLegislator.asistencia}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Lealtad Partidista</div>
                  <div className="text-2xl font-bold text-slate-900">{selectedLegislator.lealtad}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-[#8B1A1A] h-1.5 rounded-full" style={{ width: `${selectedLegislator.lealtad}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Iniciativas Votadas</div>
                  <div className="text-2xl font-bold text-slate-900">{selectedLegislator.historial_votos.length}</div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-4">Historial de Votaciones</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Iniciativa</th>
                      <th className="px-4 py-3 text-center">Sentido del Voto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedLegislator.historial_votos.map((voto: any, idx: number) => {
                      const votacionInfo = votaciones.find(v => v.id === voto.votacion_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {votacionInfo ? votacionInfo.fecha : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {votacionInfo ? votacionInfo.titulo : 'Votación no encontrada'}
                            {votacionInfo && <div className="text-xs text-slate-400 font-normal mt-0.5">{votacionInfo.expediente}</div>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${
                              voto.sentido === 'favor' ? 'bg-emerald-50 text-emerald-700' :
                              voto.sentido === 'contra' ? 'bg-red-50 text-red-700' :
                              voto.sentido === 'abstencion' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {voto.sentido === 'favor' ? 'A Favor' : 
                               voto.sentido === 'contra' ? 'En Contra' : 
                               voto.sentido === 'abstencion' ? 'Abstención' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
