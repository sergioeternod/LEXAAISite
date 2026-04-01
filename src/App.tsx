import { useState, useEffect, useMemo, memo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import html2pdf from 'html2pdf.js';
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
  ExternalLink,
  Youtube,
  Eye
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import EdomexMap from './components/EdomexMap';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { expedientes, alertas, kpis, votaciones, resumenesSemanales, legisladores } from './data/mockData';
import { legisladorData } from './data/legisladorFotos';
import { districtMunicipalities } from './data/districtMunicipalities';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const calculateExpectedVoteByParty = (claveOficial: string) => {
  const expediente = expedientes.find(e => e.clave_oficial === claveOficial);
  if (!expediente) return [];

  const promovente = expediente.actores.find(a => a.rol === "Promovente");
  const partidoPromovente = promovente?.partido?.toLowerCase();

  const partidos = Array.from(new Set(legisladores.map(l => l.partido)));

  return partidos.map(partido => {
    let favor = 0;
    let contra = 0;
    let abstencion = 0;

    legisladores.filter(l => l.partido === partido).forEach(leg => {
      if (partidoPromovente && leg.partido.toLowerCase() === partidoPromovente) {
        favor++;
      } else {
        if (Math.random() > 0.5) contra++;
        else abstencion++;
      }
    });

    return {
      partido,
      favor,
      contra,
      abstencion,
      color: legisladores.find(l => l.partido === partido)?.color || "#000"
    };
  });
};

const VoteChart = memo(({ favor, contra, abstencion, expedienteId }: { favor: number, contra: number, abstencion: number, expedienteId?: string }) => {
  const total = useMemo(() => favor + contra + abstencion, [favor, contra, abstencion]);
  
  const partyData = useMemo(() => {
    if (total === 0 && expedienteId) {
      return calculateExpectedVoteByParty(expedienteId);
    }
    return [];
  }, [total, expedienteId]);

  const displayData = useMemo(() => {
    if (total === 0 && partyData.length > 0) {
      return {
        favor: partyData.reduce((acc, p) => acc + p.favor, 0),
        contra: partyData.reduce((acc, p) => acc + p.contra, 0),
        abstencion: partyData.reduce((acc, p) => acc + p.abstencion, 0)
      };
    }
    return { favor, contra, abstencion };
  }, [total, partyData, favor, contra, abstencion]);

  const displayTotal = useMemo(() => displayData.favor + displayData.contra + displayData.abstencion, [displayData]);
  
  const data = useMemo(() => [
    { name: 'A Favor', value: displayData.favor, color: '#e60000', percentage: Math.round((displayData.favor/displayTotal)*100), badgeBg: 'bg-red-50' },
    { name: 'Abstenciones', value: displayData.abstencion, color: '#f59e0b', percentage: Math.round((displayData.abstencion/displayTotal)*100), badgeBg: 'bg-amber-50' },
    { name: 'En Contra', value: displayData.contra, color: '#cbd5e1', percentage: Math.round((displayData.contra/displayTotal)*100), badgeBg: 'bg-slate-100' }
  ].filter(d => d.value > 0), [displayData, displayTotal]);

  const maxPercentage = useMemo(() => Math.max(...data.map(d => d.percentage)), [data]);

  return (
    <div className="w-full max-w-sm mx-auto my-8 card-3d card-3d-hover p-6 flex flex-col items-center vote-chart-container" style={{ margin: '32px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mb-6 flex flex-col items-center text-center w-full">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tendencia</h4>
        <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
          {total === 0 ? "Votación Esperada" : "Votación Realizada"}
          <span className={`ml-2 text-[10px] ${total === 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'} px-2 py-0.5 rounded-full`}>
            {total === 0 ? "Proyectada" : "Oficial"}
          </span>
        </h3>
      </div>
      
      <div className="relative w-full h-48 mx-auto mb-8 flex items-center justify-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ maxWidth: '200px', maxHeight: '200px', overflow: 'visible' }}>
          <g transform="rotate(-90 50 50)">
            {data.reduce((acc, slice, i) => {
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const slicePercentage = slice.value / displayTotal;
              const strokeDasharray = `${slicePercentage * circumference} ${circumference}`;
              const strokeDashoffset = acc.offset;
              
              acc.elements.push(
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                />
              );
              
              acc.offset += slicePercentage * circumference;
              return acc;
            }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
          </g>
          <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="900" fill="#0f172a">
            {maxPercentage}%
          </text>
          <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill="#94a3b8" letterSpacing="0.5">
            CONSENSO AI
          </text>
        </svg>
      </div>

      <div className="mt-auto w-full">
        <table className="w-full text-sm vote-chart-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {total === 0 && partyData.length > 0 ? (
              partyData.map((p) => (
                <tr key={p.partido} className="border-b border-slate-100 last:border-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="py-2" style={{ padding: '8px 0' }}>
                    <div className="flex items-center space-x-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color, width: '8px', height: '8px', borderRadius: '50%' }}></div>
                      <span className="font-bold text-slate-700">{p.partido}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right" style={{ padding: '8px 0', textAlign: 'right' }}>
                    <span className="text-red-600 font-medium mr-2">{p.favor} F</span>
                    <span className="text-slate-400 font-medium mr-2">{p.contra} C</span>
                    <span className="text-amber-600 font-medium">{p.abstencion} A</span>
                  </td>
                </tr>
              ))
            ) : (
              data.map((item) => (
                <tr key={item.name} className="border-b border-slate-100 last:border-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="py-3" style={{ padding: '12px 0' }}>
                    <div className="flex items-center space-x-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, width: '12px', height: '12px', borderRadius: '50%' }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right" style={{ padding: '12px 0', textAlign: 'right' }}>
                    <span className={`px-3 py-1 rounded-md text-sm font-bold ${item.badgeBg} text-slate-900 inline-block`} style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: item.badgeBg === 'bg-red-50' ? '#fef2f2' : item.badgeBg === 'bg-amber-50' ? '#fffbeb' : '#f1f5f9', display: 'inline-block' }}>
                      {item.value}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const VoteResults = memo(({ favor, contra, abstencion, expedienteId }: { favor: number, contra: number, abstencion: number, expedienteId: string }) => {
  const hasVotes = favor + contra + abstencion > 0;
  return (
    <>
      <VoteChart favor={favor} contra={contra} abstencion={abstencion} expedienteId={expedienteId} />
      
      {hasVotes && (
        <div className="grid grid-cols-3 gap-6 text-center mb-8 mt-6">
          <div className="card-3d p-4 border-emerald-100">
            <div className="text-3xl font-mono font-light text-emerald-600 tracking-tighter">{favor}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">A Favor</div>
          </div>
          <div className="card-3d p-4 border-red-100">
            <div className="text-3xl font-mono font-light text-red-600 tracking-tighter">{contra}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">En Contra</div>
          </div>
          <div className="card-3d p-4 border-slate-200">
            <div className="text-3xl font-mono font-light text-slate-600 tracking-tighter">{abstencion}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Abstenciones</div>
          </div>
        </div>
      )}
    </>
  );
});

const MarkdownComponents = {
  code({node, inline, className, children, ...props}: any) {
    const match = /language-(\w+)/.exec(className || '')
    if (!inline && match && match[1] === 'json') {
      try {
        const data = JSON.parse(String(children).replace(/\n$/, ''));
        if (data.type === 'vote_chart') {
          return <VoteChart favor={data.favor} contra={data.contra} abstencion={data.abstencion} />;
        }
      } catch (e) {
        // Fallback to standard code block
      }
    }
    return <code className={className} {...props}>{children}</code>
  }
};

const COLORS = ['#B3282D', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedExpediente, setSelectedExpediente] = useState<any>(null);
  const [selectedVote, setSelectedVote] = useState<any>(null);
  const [filterParty, setFilterParty] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Explore Mode State
  const [exploreMode, setExploreMode] = useState<'expedientes' | 'legisladores'>('expedientes');
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedLegislator, setSelectedLegislator] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);

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
  const [subscribedExpedientes, setSubscribedExpedientes] = useState<string[]>([]);
  const [alertKeywords, setAlertKeywords] = useState<string[]>([]);

  // AI Search State
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string | null>(null);

  // Advanced Filters
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterDate, setFilterDate] = useState<string>('Todos');

  const displayDistrict = hoveredDistrict || selectedDistrict;

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
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Usuario',
              photoURL: currentUser.photoURL || '',
              history: [],
              interests: [],
              savedExpedientes: [],
              savedLegisladores: [],
              subscribedExpedientes: [],
              alertKeywords: []
            });
          } else {
            const data = userSnap.data();
            setUserHistory(data.history || []);
            setSavedExpedientes(data.savedExpedientes || []);
            setSavedLegisladores(data.savedLegisladores || []);
            setSubscribedExpedientes(data.subscribedExpedientes || []);
            setAlertKeywords(data.alertKeywords || []);
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          alert(`Error al cargar tu perfil: ${error.message}`);
        }
      } else {
        setUserHistory([]);
        setSavedExpedientes([]);
        setSavedLegisladores([]);
        setSubscribedExpedientes([]);
        setAlertKeywords([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(`¡ATENCIÓN!\n\nEl dominio actual (${currentDomain}) NO está autorizado en Firebase.\n\nDebes ir a la consola de Firebase -> Authentication -> Settings -> Authorized domains y agregar exactamente:\n\n${currentDomain}`);
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        alert("La ventana emergente fue bloqueada o la cerraste antes de terminar. Por favor, intenta de nuevo y permite las ventanas emergentes.");
      } else {
        alert(`Error al iniciar sesión: ${error.message || 'Intenta nuevamente más tarde.'}`);
      }
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

  const toggleSubscribeExpediente = async (id: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const isSubscribed = subscribedExpedientes.includes(id);
    const newSubscribed = isSubscribed 
      ? subscribedExpedientes.filter(e => e !== id) 
      : [...subscribedExpedientes, id];
    
    setSubscribedExpedientes(newSubscribed);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { subscribedExpedientes: newSubscribed });
    } catch (error) {
      console.error("Error subscribing to expediente", error);
    }
  };

  const toggleAlertKeyword = async (keyword: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const isAlerted = alertKeywords.includes(keyword);
    const newAlerts = isAlerted 
      ? alertKeywords.filter(k => k !== keyword) 
      : [...alertKeywords, keyword];
    
    setAlertKeywords(newAlerts);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { alertKeywords: newAlerts });
    } catch (error) {
      console.error("Error toggling alert keyword", error);
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


  const exportSummaryToPDF = async () => {
    try {
      if (!contentRef.current) {
        console.error("contentRef.current is null");
        return;
      }
      
      // Ensure all fonts are loaded before taking the snapshot
      await document.fonts.ready;

      // Extract and sanitize CSS asynchronously to ensure we capture external stylesheets
      let rawCSS = '';
      
      // 1. Get inline styles
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach(style => {
        rawCSS += style.innerHTML + '\n';
      });

      // 1.5 Get parsed stylesheets (this handles @import and already parsed rules)
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          // Only process stylesheets that are not from external domains (to avoid CORS errors)
          // or if they are, we hope they have CORS headers.
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            for (let j = 0; j < rules.length; j++) {
              rawCSS += rules[j].cssText + '\n';
            }
          }
        } catch (e) {
          console.warn('Cannot access cssRules for stylesheet', sheet.href, e);
        }
      }

      // 1.6 Get adoptedStyleSheets
      if ('adoptedStyleSheets' in document) {
        const adoptedSheets = (document as any).adoptedStyleSheets;
        for (let i = 0; i < adoptedSheets.length; i++) {
          const sheet = adoptedSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                rawCSS += rules[j].cssText + '\n';
              }
            }
          } catch (e) {
            console.warn('Cannot access cssRules for adopted stylesheet', e);
          }
        }
      }

      // 2. Fetch external stylesheets
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < linkTags.length; i++) {
        const link = linkTags[i] as HTMLLinkElement;
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            rawCSS += cssText + '\n';
          }
        } catch (e) {
          console.warn('Could not fetch stylesheet', link.href, e);
        }
      }

      // Aggressively sanitize rawCSS to prevent html2canvas parsing errors
      // Replace any CSS property value that contains an unsupported color function with a safe color
      rawCSS = rawCSS.replace(/:[^;}{]*(?:oklch|oklab|lch|lab|hwb|color\()[^;}{]*/gi, ': #94a3b8');

      const opt = {
        margin:       [35, 20, 30, 20] as [number, number, number, number],
        filename:     `expediente_${selectedExpediente?.clave_oficial || 'summary'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', '.pdf-avoid-break'] },
        html2canvas:  {
          useCORS: true,
          allowTaint: false,
          scale: 2,
          windowWidth: 1200,
          logging: false,
          onclone: (clonedDoc: Document) => {
          // 1. Remove all existing style tags and links in the cloned document
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => style.remove());
          
          const links = clonedDoc.querySelectorAll('link');
          links.forEach(link => {
            if (link.rel === 'stylesheet' || link.getAttribute('as') === 'style' || link.href.endsWith('.css')) {
              link.remove();
            }
          });

          // 2. Inject the synchronously extracted and sanitized CSS
          const newStyle = clonedDoc.createElement('style');
          newStyle.innerHTML = rawCSS;
          clonedDoc.head.appendChild(newStyle);
          
          // 2.5 Inject Google Fonts link to ensure correct font metrics
          const fontLink = clonedDoc.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
          clonedDoc.head.appendChild(fontLink);

          // 3. Sanitize inline styles in the cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const element = el as HTMLElement;
            const styleAttr = element.getAttribute('style');
            if (styleAttr) {
              // Only sanitize if it contains unsupported color functions
              if (/(?:oklch|oklab|lch|lab|hwb|color)\s*\(/.test(styleAttr)) {
                const sanitizedStyle = styleAttr
                  .replace(/(?:oklch|oklab|lch|lab|hwb|color)\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gi, 'rgb(148, 163, 184)')
                  .replace(/(?:oklch|oklab|lch|lab|hwb|color)\s*\(/gi, 'rgb(');
                element.setAttribute('style', sanitizedStyle);
              }
            }
          });

          // 4. Hide specific buttons instead of all buttons to preserve tabs
          const buttons = clonedDoc.querySelectorAll('button');
          buttons.forEach(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            if (
              text.includes('descargar') || 
              text.includes('guardar') || 
              text.includes('alerta') ||
              text.includes('volver') ||
              text.includes('explorar') ||
              text.includes('generar') ||
              btn.querySelector('svg.lucide-download') ||
              btn.querySelector('svg.lucide-bookmark') ||
              btn.querySelector('svg.lucide-bell') ||
              btn.querySelector('svg.lucide-chevron-right')
            ) {
              btn.style.display = 'none';
            }
          });

          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach(svg => {
            if (
              svg.classList.contains('lucide-check-circle-2') || 
              svg.classList.contains('lucide-check') || 
              svg.classList.contains('lucide-check-circle') ||
              svg.classList.contains('lucide-check-square') ||
              svg.classList.contains('lucide-download')
            ) {
              svg.remove();
            }
          });

          // 5. Remove all links (a tags)
          const aTags = clonedDoc.querySelectorAll('a');
          aTags.forEach(a => {
            // Replace the a tag with a span containing its text content, or just remove it if it's an image link
            if (a.querySelector('img')) {
              a.remove();
            } else {
              const span = clonedDoc.createElement('span');
              span.innerHTML = ' ' + a.innerHTML + ' ';
              span.className = a.className;
              // Remove hover classes and underline
              span.className = span.className.replace(/hover:[^\s]+/g, '').replace('underline', '');
              a.parentNode?.replaceChild(span, a);
            }
          });

          // 6. Enhance Typography and Layout for PDF
          const pdfStyles = clonedDoc.createElement('style');
          pdfStyles.innerHTML = `
            /* Reset base font size to ensure consistent scaling */
            html { font-size: 16px !important; }
            
            /* Remove custom spacing and justification that breaks html2canvas */
            * {
              letter-spacing: normal !important;
              word-spacing: normal !important;
            }
            
            .prose * {
              font-family: "Inter", sans-serif !important;
            }
            
            /* Enhance readability with consistent sizes */
            .prose p, .prose li, .prose span { 
              font-size: 12px !important; 
              line-height: 1.5 !important; 
              color: #1e293b !important;
              text-align: left !important; /* Justify causes overlapping characters in PDF */
            }
            
            /* Only target specific paragraphs for readability, not all of them */
            .card-3d > p, .bg-white > p {
              font-size: 12px !important;
              line-height: 1.5 !important;
            }
            
            .prose p { margin-bottom: 12px !important; }
            .prose li { margin-bottom: 6px !important; }
            
            /* Style markdown tables generated by AI */
            .prose table:not(.vote-chart-table) { width: 100% !important; border-collapse: collapse !important; margin-bottom: 16px !important; }
            .prose table:not(.vote-chart-table) th, .prose table:not(.vote-chart-table) td { border: 1px solid #e2e8f0 !important; padding: 8px !important; text-align: left !important; font-size: 12px !important; }
            .prose table:not(.vote-chart-table) th { background-color: #f8fafc !important; font-weight: bold !important; color: #0f172a !important; }
            
            /* Make headings stand out more and prevent crowding */
            h1 { font-size: 22px !important; margin-bottom: 12px !important; color: #8B1A1A !important; font-weight: bold !important; }
            h2 { 
              font-size: 18px !important; 
              margin-top: 18px !important; 
              margin-bottom: 10px !important; 
              border-bottom: 2px solid #8B1A1A !important; 
              padding-bottom: 6px !important; 
              color: #0f172a !important;
              font-weight: bold !important;
            }
            h3 { font-size: 16px !important; margin-top: 16px !important; margin-bottom: 8px !important; color: #334155 !important; font-weight: 600 !important; }
            
            /* Divide sections clearly and prevent object crowding */
            .bg-white.border, .card-3d {
              background-color: #ffffff !important;
            }
            
            /* Prevent awkward page breaks inside small elements */
            .recharts-wrapper,
            .relative.pl-8, /* Timeline items */
            .flex.items-start.space-x-4, /* Evidence items */
            .w-full.max-w-sm.mx-auto, /* Voting gauge */
            .vote-chart-container {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            p, li {
              /* Allow natural page breaks inside paragraphs and lists to avoid huge blank spaces */
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            
            /* Reduce font sizes and spacing for PDF */
            .prose p, .prose li, .prose table, .text-base {
              font-size: 12px !important;
              line-height: 1.5 !important;
            }
            .text-sm { font-size: 11px !important; }
            .text-xs { font-size: 10px !important; }
            .text-lg { font-size: 14px !important; }
            .text-xl { font-size: 16px !important; }
            .text-2xl { font-size: 18px !important; }
            .text-3xl { font-size: 20px !important; }
            .text-4xl { font-size: 24px !important; }
            
            .space-y-10 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem !important; }
            .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem !important; }
            .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; }
            .gap-10 { gap: 1.5rem !important; }
            .mt-10 { margin-top: 1.5rem !important; }
            .mb-10 { margin-bottom: 1.5rem !important; }
            .p-6 { padding: 1.25rem !important; }
            
            /* Fix main layout grids for PDF */
            .pdf-main-grid {
              display: block !important;
              width: 100% !important;
            }
            .pdf-main-content {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin-bottom: 2rem !important;
            }
            .pdf-sidebar {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .grid-cols-1.lg\\:grid-cols-2 {
              display: block !important;
            }
            .grid-cols-1.lg\\:grid-cols-2 > div {
              margin-bottom: 1rem !important;
            }
            
            /* Reduce large paddings and margins for PDF to save space */
            .p-8 { padding: 16px !important; }
            .mb-8 { margin-bottom: 16px !important; }
            .mt-10 { margin-top: 20px !important; }
            .pt-10 { padding-top: 20px !important; }
            .space-y-10 > :not([hidden]) ~ :not([hidden]) { margin-top: 20px !important; }
            .gap-10 { gap: 20px !important; }
            .mt-12 { margin-top: 24px !important; }
            .mb-12 { margin-bottom: 24px !important; }
            
            /* Hide tooltips and interactive elements */
            .opacity-0, .group-hover\\:opacity-100, .cursor-help {
              display: none !important;
            }
            
            /* Make tabs larger and more distinct */
            .flex.space-x-1.bg-slate-100 {
              padding: 16px !important;
              margin-bottom: 48px !important;
              border-radius: 16px !important;
              background-color: #f1f5f9 !important;
              gap: 16px !important;
            }
            .flex.space-x-1.bg-slate-100 button {
              font-size: 20px !important;
              padding: 16px 32px !important;
              border-radius: 12px !important;
              margin: 0 !important;
            }

            /* Fix chart rendering */
            .recharts-responsive-container {
              width: 100% !important;
              height: 250px !important;
              position: relative !important;
            }
            .recharts-wrapper {
              width: 100% !important;
              height: 100% !important;
              margin: 0 auto !important;
            }
            .recharts-surface {
              width: 100% !important;
              height: 100% !important;
            }
          `;
          clonedDoc.head.appendChild(pdfStyles);

          // Remove chat input area and other excluded elements to make the PDF cleaner
          const excludedElements = clonedDoc.querySelectorAll('.pdf-exclude');
          excludedElements.forEach(el => el.remove());
          
          const chatInputArea = clonedDoc.querySelector('.p-5.bg-white.border-t.border-slate-200');
          if (chatInputArea) chatInputArea.remove();

          // Expand chat section to show all AI analysis messages
          const chatSection = clonedDoc.querySelector('.chat-section') as HTMLElement;
          if (chatSection) {
            chatSection.style.height = 'auto';
            chatSection.style.maxHeight = 'none';
            chatSection.classList.remove('h-[600px]', 'overflow-hidden');
            
            const messagesContainer = chatSection.querySelector('.overflow-y-auto') as HTMLElement;
            if (messagesContainer) {
              messagesContainer.style.overflow = 'visible';
              messagesContainer.style.height = 'auto';
              messagesContainer.style.maxHeight = 'none';
              messagesContainer.classList.remove('overflow-y-auto');
              
              // Remove greeting message if present
              const messages = messagesContainer.querySelectorAll('.flex.justify-start');
              if (messages.length > 0) {
                const firstMessage = messages[0];
                if (firstMessage.textContent?.includes('LEXA IA')) {
                  firstMessage.remove();
                }
              }
              
              // Remove user messages completely
              const userMessages = messagesContainer.querySelectorAll('.flex.justify-end');
              userMessages.forEach(msg => msg.remove());
              
              // Remove conversational questions from AI messages
              const aiParagraphs = messagesContainer.querySelectorAll('.prose p');
              aiParagraphs.forEach(p => {
                if (p.textContent && (p.textContent.includes('¿Desea') || p.textContent.includes('¿Te gustaría') || p.textContent.includes('¿Quisieras') || p.textContent.includes('¿Te interesa'))) {
                  p.remove();
                }
              });
            }
          }

          // Remove breadcrumb to make the PDF cleaner
          const breadcrumb = clonedDoc.querySelector('.flex.items-center.space-x-2.text-sm.text-slate-500.mb-4');
          if (breadcrumb) breadcrumb.remove();

          // 5. Add Header
          clonedDoc.body.style.backgroundColor = '#ffffff';
          clonedDoc.body.style.color = '#0f172a'; // slate-900          // Force desktop width for consistent layout
          const clonedContent = clonedDoc.getElementById('pdf-content-wrapper') as HTMLElement;
          const targetElement = clonedContent || clonedDoc.body.firstElementChild || clonedDoc.body;
          
          if (targetElement) {
            (targetElement as HTMLElement).style.width = '1200px';
            (targetElement as HTMLElement).style.maxWidth = '1200px';
            (targetElement as HTMLElement).style.margin = '0 auto';
            (targetElement as HTMLElement).style.padding = '40px 60px'; // Add generous padding for the PDF
            (targetElement as HTMLElement).style.backgroundColor = '#ffffff'; // Ensure white background
          }
        }
      }
    };

    const worker = html2pdf().set(opt).from(contentRef.current);
      const pdf = await worker.toPdf().get('pdf');
      
      // Pagination and Header/Footer logic
      const totalPages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Generate logo as base64 image
      const generateLogoDataUrl = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Set font
        ctx.font = '900 72px "Inter", sans-serif';
        ctx.textBaseline = 'middle';

        // Draw LEXA
        ctx.fillStyle = '#0f172a';
        ctx.fillText('LEXA', 10, 60);

        // Measure LEXA
        const lexaWidth = ctx.measureText('LEXA ').width;

        // Create gradient for IA
        const gradient = ctx.createLinearGradient(10 + lexaWidth, 0, 10 + lexaWidth + ctx.measureText('IA').width, 0);
        gradient.addColorStop(0, '#FF8B53');
        gradient.addColorStop(1, '#EB577A');

        // Draw IA
        ctx.fillStyle = gradient;
        ctx.fillText('IA', 10 + lexaWidth, 60);

        return canvas.toDataURL('image/png');
      };
      
      const logoDataUrl = generateLogoDataUrl();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // --- HEADER ---
        // Background box
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.5);
        pdf.rect(20, 10, pageWidth - 40, 20, 'FD'); // Fill and Draw
        
        // LEXA IA Logo
        if (logoDataUrl) {
          pdf.addImage(logoDataUrl, 'PNG', 22, 14, 30, 9);
        } else {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(15, 23, 42); // slate-900
          pdf.text("LEXA", 25, 23);
          pdf.setTextColor(235, 87, 122); // pink-500
          pdf.text("IA", 41, 23);
        }
        
        // Divider
        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setLineWidth(0.5);
        pdf.line(55, 14, 55, 26);
        
        // Reporte Text
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.text("REPORTE DE INTELIGENCIA LEGISLATIVA", 60, 19);
        
        // Date
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184); // slate-400
        const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        pdf.text(dateStr, 60, 24);
        
        // Right side (Expediente / IA)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(selectedExpediente ? "EXPEDIENTE" : "BÚSQUEDA", pageWidth - 25, 18, { align: 'right' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.text(selectedExpediente?.clave_oficial || 'IA', pageWidth - 25, 24, { align: 'right' });
        
        // --- FOOTER ---
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(
          `Página ${i} de ${totalPages}`, 
          pageWidth / 2, 
          pageHeight - 15, 
          { align: 'center' }
        );
      }

      // Explicit download trigger
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expediente_${selectedExpediente?.clave_oficial || 'summary'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleSearch = (query?: string | any) => {
    const q = typeof query === 'string' ? query : searchQuery;
    if (!q.trim()) return;
    
    if (typeof query === 'string') {
      setSearchQuery(query);
    }
    
    trackHistory('search', q);
    setCurrentView('explorar');

    // Siempre ejecutar búsqueda por LEXA IA directamente
    handleAiSearch(q);
  };

  const handleAiSearch = async (query?: string | any) => {
    const q = typeof query === 'string' ? query : searchQuery;
    if (!q.trim()) return;
    setIsAiSearchActive(true);
    setIsAiSearchLoading(true);
    setAiSearchResults(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key de Gemini no configurada. Por favor, configúrala en el panel de Secretos.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Actúa como un analista legislativo experto del Congreso del Estado de México (Edomex). Analiza las versiones estenográficas (simuladas basadas en tu conocimiento general) sobre el tema legal o palabra clave: '${q}'. Identifica las opiniones de los diputados locales participantes respecto a este tema, prestando especial atención a la bancada de Morena liderada por Francisco Vázquez si es relevante al tema. Excluye estrictamente cualquier insulto, ataque político o alusión personal. 
      
      Presenta un resumen estructurado. Para el análisis de posturas, DEBES usar una tabla Markdown correctamente formateada con saltos de línea, exactamente con esta estructura:

      ### Análisis de Posturas Legislativas
      
      | Legislador | Grupo Parlamentario | Postura / Argumento Principal |
      | :--- | :--- | :--- |
      | Nombre 1 | Partido 1 | Argumento 1 |
      | Nombre 2 | Partido 2 | Argumento 2 |
      
      Asegúrate de incluir también un análisis sobre el "impacto" de la medida discutida y los "actores involucrados" (quiénes la promueven, quiénes se oponen, a quiénes afecta). Usa formato Markdown.
      
      IMPORTANTE: Si en tu análisis mencionas resultados de votaciones pasadas o expectativas/tendencias de votación, DEBES incluir al final un bloque de código JSON exacto con este formato para renderizar una gráfica visual:
      \`\`\`json
      { "type": "vote_chart", "favor": 52, "contra": 18, "abstencion": 5 }
      \`\`\`
      Ajusta los números según corresponda a tu análisis.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiSearchResults(response.text || "No se pudo generar un análisis.");
    } catch (error: any) {
      console.error("Error generating AI search:", error);
      setAiSearchResults(error.message || "Hubo un error al generar el análisis. Por favor, intenta de nuevo.");
    } finally {
      setIsAiSearchLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExpediente) {
      trackHistory('view_expediente', selectedExpediente.clave_oficial);
      setChatInput('');
      
      const generateInitialSummary = async () => {
        setIsAiSearchLoading(true);
        setChatMessages([{
          role: 'model',
          text: `Generando resumen analítico del expediente ${selectedExpediente.clave_oficial}...`
        }]);
        
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key de Gemini no configurada. Por favor, configúrala en el panel de Secretos.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `Actúa como LEXA IA, un asistente experto en inteligencia legislativa del Estado de México.
          Genera un resumen analítico y conciso del siguiente expediente:
          Título: ${selectedExpediente.titulo}
          Clave: ${selectedExpediente.clave_oficial}
          Estado: ${selectedExpediente.estado_actual}
          Tema: ${selectedExpediente.tema_principal}
          Descripción: ${selectedExpediente.descripcion}
          Impacto Score: ${selectedExpediente.impacto_score}/100
          Actores Involucrados: ${selectedExpediente.actores ? selectedExpediente.actores.map((a: any) => `${a.nombre} (${a.rol} - ${a.partido})`).join(", ") : 'No especificados'}
          Resumen Ejecutivo: ${selectedExpediente.resumen_ia.ejecutivo}
          
          Tu respuesta debe ser un resumen estructurado en Markdown que incluya:
          1. El **contexto** general de la iniciativa.
          2. El **impacto** proyectado (mencionando el Impacto Score).
          3. Los **actores** clave involucrados.
          4. La **intención de voto esperada** o el resultado de la última votación (simulada basada en el contexto político actual del Edomex).
          
          Sé profesional, analítico y directo. NO incluyas saludos ni introducciones como 'Saludos, soy LEXA IA...'. TAMPOCO incluyas preguntas finales ni ofrezcas más información al usuario. Termina tu respuesta directamente después del análisis.
          
          IMPORTANTE: DEBES incluir al final de tu respuesta un bloque de código JSON exacto con este formato para renderizar una gráfica visual de la intención de voto o resultado:
          \`\`\`json
          { "type": "vote_chart", "favor": 52, "contra": 18, "abstencion": 5 }
          \`\`\`
          Ajusta los números (que idealmente sumen los 75 diputados del Edomex) según tu análisis político de la viabilidad de la iniciativa.`;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
          });

          setChatMessages([{
            role: 'model',
            text: response.text || `Hola, soy LEXA. Estoy lista para responder tus dudas sobre el expediente ${selectedExpediente.clave_oficial}.`
          }]);
        } catch (error: any) {
          console.error("Error generating initial summary:", error);
          setChatMessages([{
            role: 'model',
            text: `Hola, soy LEXA. Estoy lista para responder tus dudas sobre el expediente ${selectedExpediente.clave_oficial}. (${error.message || 'Hubo un error al generar el resumen automático'}).`
          }]);
        } finally {
          setIsAiSearchLoading(false);
        }
      };

      generateInitialSummary();
    }
  }, [selectedExpediente]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedExpediente) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key de Gemini no configurada. Por favor, configúrala en el panel de Secretos.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `Eres LEXA IA, un asistente experto en inteligencia legislativa enfocado en el Congreso del Estado de México (Edomex). 
      Estás ayudando a un usuario a analizar el siguiente expediente legislativo local:
      Título: ${selectedExpediente.titulo}
      Clave: ${selectedExpediente.clave_oficial}
      Estado: ${selectedExpediente.estado_actual}
      Tema: ${selectedExpediente.tema_principal}
      Descripción: ${selectedExpediente.descripcion}
      Impacto Score: ${selectedExpediente.impacto_score}/100
      Actores Involucrados: ${selectedExpediente.actores ? selectedExpediente.actores.map((a: any) => `${a.nombre} (${a.rol} - ${a.partido})`).join(", ") : 'No especificados'}
      Resumen Ejecutivo: ${selectedExpediente.resumen_ia.ejecutivo}
      Evidencia clave: ${selectedExpediente.resumen_ia.evidencia ? selectedExpediente.resumen_ia.evidencia.map((e: any) => e.texto).join(" | ") : 'No especificada'}
      
      Responde a las preguntas del usuario basándote en esta información. Presta especial atención a detallar el impacto (basado en el Impacto Score) y los actores involucrados cuando se te pregunte. Sé profesional, analítico, objetivo y conciso. NO incluyas saludos ni introducciones como 'Saludos, soy LEXA IA...'. Considera el contexto político del Estado de México y sus principales actores (como Francisco Vázquez, coordinador de Morena) si es relevante. Si te preguntan algo fuera del contexto de este expediente, indícalo cortésmente.
      
      IMPORTANTE: Si en tu respuesta mencionas resultados de votaciones o tendencias/expectativas de votos, DEBES incluir un bloque de código JSON con este formato para que el sistema renderice una gráfica visual:
      \`\`\`json
      { "type": "vote_chart", "favor": 52, "contra": 18, "abstencion": 5 }
      \`\`\`
      Ajusta los números según la información del expediente o tu análisis.`;

      const contents = [
        ...chatMessages.filter(m => !m.text.includes('Generando resumen analítico')).map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: userMsg }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      setChatMessages(prev => [...prev, { role: 'model', text: response.text || 'No pude generar una respuesta.' }]);
    } catch (error: any) {
      console.error("Error calling Gemini:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: error.message || 'Ocurrió un error al consultar a LEXA IA. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderTopNav = () => (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <button 
        onClick={() => {
          setCurrentView('dashboard');
          setSelectedExpediente(null);
          setSelectedVote(null);
        }}
        className="flex items-center space-x-1 transform scale-y-[0.8] scale-x-[1.1] origin-left w-32 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
      >
        <span className="text-2xl font-black text-slate-900 tracking-tighter">LEXA</span>
        <span className="text-2xl font-black bg-gradient-to-r from-[#FF8B53] to-[#EB577A] text-transparent bg-clip-text tracking-tighter">IA</span>
      </button>
      
      <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-slate-100/50 p-1 rounded-full border border-slate-200  shadow-sm">
        <button 
          onClick={() => { setCurrentView('dashboard'); setSelectedExpediente(null); }}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${currentView === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          Panel
        </button>
        <button 
          onClick={() => { setCurrentView('explorar'); setSelectedExpediente(null); }}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${currentView === 'explorar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          Historial
        </button>
        <button 
          onClick={() => { setCurrentView('alertas'); setSelectedExpediente(null); }}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${currentView === 'alertas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          <span>Alertas</span>
          <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#8B1A1A] rounded-full shadow-sm">
            2
          </span>
        </button>
        <button 
          onClick={() => { setCurrentView('mapa'); setSelectedExpediente(null); }}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${currentView === 'mapa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          Mapa
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
            <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-sm border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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
    <div className="space-y-12 max-w-5xl mx-auto pt-8 pb-16 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="text-center space-y-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <Sparkles className="w-12 h-12 text-[#8B1A1A]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Explora el historial legislativo con <span className="text-[#8B1A1A]">LEXA IA</span>
        </h1>
        
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-slate-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative flex items-center w-full h-16 rounded-full bg-white border border-slate-200 shadow-[var(--card-shadow)] overflow-hidden pl-6 pr-2">
            <Search className="w-6 h-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Busca por tema, legislador o palabra clave..."
              className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 text-slate-700 placeholder-slate-400 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full transition-all shadow-sm hover:shadow-sm whitespace-nowrap">
              Consultar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="card-3d card-3d-hover p-8 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Última votación relevante</h3>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 leading-tight">
              Reforma al Artículo 4 Constitucional en materia de bienestar
            </p>
          </div>
          <div className="mt-4 pt-6 border-t border-slate-100/50 flex items-end justify-between">
            <div className="text-4xl font-mono font-light text-emerald-600 tracking-tighter">68%</div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">A FAVOR</div>
          </div>
        </div>

        <div className="card-3d card-3d-hover p-8 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aprobada</h3>
            </div>
            <p className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 leading-tight">
              Iniciativa con proyecto de decreto por el que se expide la Ley General de Aguas
            </p>
          </div>
          <div className="mt-4 pt-6 border-t border-slate-100/50 flex items-end justify-between">
            <div className="text-4xl font-mono font-light text-slate-900 tracking-tighter">82%</div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">CONSENSO</div>
          </div>
        </div>

        <div className="card-3d card-3d-hover p-8 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tendencias</h3>
            <div className="p-2.5 bg-red-50 text-[#8B1A1A] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-5 mt-2">
            <div className="flex items-center justify-between group/item">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono font-bold text-slate-300">01</span>
                <span className="text-base font-medium text-slate-700 group-hover/item:text-[#8B1A1A] transition-colors">Energía Renovable</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+24%</span>
            </div>
            <div className="flex items-center justify-between group/item">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono font-bold text-slate-300">02</span>
                <span className="text-base font-medium text-slate-700 group-hover/item:text-[#8B1A1A] transition-colors">Ciberseguridad</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+18%</span>
            </div>
            <div className="flex items-center justify-between group/item">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono font-bold text-slate-300">03</span>
                <span className="text-base font-medium text-slate-700 group-hover/item:text-[#8B1A1A] transition-colors">Movilidad Urbana</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tu Actividad Reciente (Solo usuarios registrados) */}
      {user && userHistory.length > 0 && (
        <div className="card-3d p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/40 rounded-bl-full -z-10"></div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-[#8B1A1A]" />
              Tu Actividad Reciente
            </h3>
            <button 
              onClick={() => setCurrentView('explorar')}
              className="text-sm font-bold text-[#8B1A1A] hover:text-[#701515] transition-colors uppercase tracking-wider flex items-center"
            >
              Ver todo el historial
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userHistory.slice().reverse().slice(0, 4).map((item) => (
              <div 
                key={item.timestamp} 
                onClick={() => {
                  handleSearch(item.query);
                }}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:bg-white hover:shadow-sm .5 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-40 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:from-[#8B1A1A] group-hover:to-red-500 transition-all duration-500"></div>
                <div className="flex items-start justify-between mt-1">
                  <div className={`p-3 rounded-xl shadow-sm border ${item.type === 'search' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {item.type === 'search' ? <Search className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {new Date(item.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {item.type === 'search' ? 'Búsqueda' : 'Expediente'}
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-[#8B1A1A] transition-colors leading-snug">
                    {item.query}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Actividad Legislativa <span className="text-sm font-sans font-normal text-slate-500 ml-2">(Últimos 4 meses)</span></h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {/* @ts-ignore */}
              <BarChart data={kpis.actividadMensual} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="iniciativas" name="Iniciativas" fill="#B3282D" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                <Bar dataKey="dictamenes" name="Dictámenes" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Distribución por Sector</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {/* @ts-ignore */}
              <PieChart>
                <Pie
                  data={kpis.sectoresTop}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
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
        <div className="card-3d p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-[#8B1A1A]" />
            Votaciones Recientes
          </h3>
          <button 
            onClick={() => setCurrentView('explorar')}
            className="text-sm font-bold text-[#8B1A1A] hover:text-[#701515] transition-colors uppercase tracking-wider flex items-center"
          >
            Ver todas
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['En Debate', 'Aprobada', 'Rechazada'].map((estado) => (
            <div key={estado} className="space-y-5">
              <div className={`flex items-center space-x-3 pb-3 border-b-2 ${
                estado === 'Aprobada' ? 'border-emerald-500/30' : 
                estado === 'Rechazada' ? 'border-red-500/30' : 
                'border-amber-500/30'
              }`}>
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  estado === 'Aprobada' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                  estado === 'Rechazada' ? 'bg-red-500 shadow-red-500/50' : 
                  'bg-amber-500 shadow-amber-500/50'
                }`} />
                <h4 className="font-bold text-slate-800 tracking-wide">{estado}</h4>
              </div>
              
              <div className="space-y-4">
                {votaciones
                  .filter(v => v.estado === estado)
                  .map(voto => (
                    <div 
                      key={voto.id} 
                      onClick={() => setSelectedVote(voto)}
                      className="card-3d card-3d-hover p-6 cursor-pointer group flex flex-col relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r transition-all ${
                        estado === 'Aprobada' ? 'from-emerald-300 to-emerald-200 group-hover:from-emerald-500 group-hover:to-emerald-400' : 
                        estado === 'Rechazada' ? 'from-red-300 to-red-200 group-hover:from-red-500 group-hover:to-red-400' : 
                        'from-amber-300 to-amber-200 group-hover:from-amber-500 group-hover:to-amber-400'
                      }`}></div>
                      <div className="flex justify-between items-start mb-4 mt-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-[#8B1A1A]/30 group-hover:text-[#8B1A1A] transition-colors shadow-sm">{voto.expediente}</span>
                        <span className="text-xs font-medium text-slate-400">{voto.fecha}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-5 line-clamp-2 group-hover:text-[#8B1A1A] transition-colors flex-1 leading-snug">{voto.titulo}</p>
                      
                      {estado !== 'En Debate' && (
                        <div className="mt-auto pt-5 border-t border-slate-100/50">
                          <div className="flex items-center space-x-1 text-xs mb-3">
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex ">
                              <div style={{ width: `${(voto.votos_favor / voto.total_votos) * 100}%` }} className="bg-emerald-500 h-full" />
                              <div style={{ width: `${(voto.votos_contra / voto.total_votos) * 100}%` }} className="bg-red-500 h-full" />
                              <div style={{ width: `${(voto.abstenciones / voto.total_votos) * 100}%` }} className="bg-slate-300 h-full" />
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">{voto.votos_favor} Favor</span>
                            <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">{voto.votos_contra} Contra</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {votaciones.filter(v => v.estado === estado).length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No hay votaciones recientes en este estado
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Resumen Legislativo Semanal */}
      <div className="card-3d p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-bl-full -z-10"></div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100/50">
            <Bot className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Resumen Legislativo Semanal (LEXA IA)</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Generado automáticamente por LEXA IA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {resumenesSemanales.map((resumen, idx) => (
            <div 
              key={idx} 
              className="card-3d card-3d-hover p-8 cursor-default group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-200 to-indigo-100 group-hover:from-indigo-600 group-hover:to-indigo-500 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-6 mt-1">
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-indigo-600/30 group-hover:text-indigo-600 transition-colors shadow-sm">{resumen.periodo}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${idx === 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {idx === 0 ? 'En Curso' : 'Pasada'}
                </span>
              </div>
              
              <p className="text-sm text-slate-800 mb-6 line-clamp-3 group-hover:text-indigo-900 transition-colors leading-relaxed">{resumen.resumen}</p>
              
              <div className="mt-auto pt-5 border-t border-slate-100/50">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Puntos Clave</h5>
                <ul className="space-y-2.5">
                  {resumen.puntos_clave.map((punto) => (
                    <li key={punto} className="flex items-start space-x-3 text-xs font-medium text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 mt-1 flex-shrink-0 shadow-sm" />
                      <span className="line-clamp-2 leading-snug group-hover:text-slate-800 transition-colors">{punto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-3d p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/40 rounded-bl-full -z-10"></div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-amber-600" />
            Últimos Expedientes Actualizados
          </h3>
          <button onClick={() => setCurrentView('explorar')} className="text-sm font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-wider flex items-center">
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {expedientes.slice(0, 3).map((exp) => (
            <div 
              key={exp.id} 
              onClick={() => setSelectedExpediente(exp)}
              className="card-3d card-3d-hover p-6 cursor-pointer group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 to-amber-100 group-hover:from-amber-500 group-hover:to-amber-400 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 mt-1">
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-amber-500/30 group-hover:text-amber-600 transition-colors shadow-sm">{exp.clave_oficial}</span>
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">{exp.fecha_inicio}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-5 line-clamp-2 group-hover:text-amber-700 transition-colors flex-1 leading-snug">{exp.titulo}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                  {exp.tema_principal}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                  {exp.estado_actual}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExplorar = () => {
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/edomex/g, 'estado de méxico')
        .replace(/#/g, '')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const filteredExpedientes = expedientes.filter(e => {
      const normalizedQuery = normalizeText(searchQuery);
      const combinedText = normalizeText(`${e.titulo} ${e.descripcion} ${e.tema_principal} ${e.clave_oficial}`);
      
      const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => combinedText.includes(term));
      
      const matchesStatus = filterStatus === 'Todos' || e.estado_actual === filterStatus;
      
      let matchesDate = true;
      if (filterDate !== 'Todos') {
        const expDate = new Date(e.fecha_inicio);
        const now = new Date();
        if (filterDate === 'Último mes') {
          matchesDate = (now.getTime() - expDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        } else if (filterDate === 'Este año') {
          matchesDate = expDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    const filteredLegisladores = legisladores
      .map((l, index) => ({ ...l, districtId: index < 45 ? index + 1 : null }))
      .filter(l => {
        const normalizedQuery = normalizeText(searchQuery);
        const combinedText = normalizeText(`${l.nombre} ${l.partido} ${l.estado}`);
        
        const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
        const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => combinedText.includes(term));
        
        const matchesParty = filterParty === 'Todos' || l.partido === filterParty;
        return matchesSearch && matchesParty;
      })
      .sort((a, b) => {
        if (a.tipo_eleccion === 'RP' && b.tipo_eleccion !== 'RP') return -1;
        if (a.tipo_eleccion !== 'RP' && b.tipo_eleccion === 'RP') return 1;
        return 0;
      });

    return (
      <div className="space-y-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Historial Legislativo</h1>
            <p className="text-slate-500 mt-3 text-lg">Busca iniciativas, dictámenes y legisladores con inteligencia semántica.</p>
          </div>
          <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200 ">
            <button 
              onClick={() => setExploreMode('expedientes')}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${exploreMode === 'expedientes' ? 'bg-white text-[#8B1A1A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Expedientes
            </button>
            <button 
              onClick={() => setExploreMode('legisladores')}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${exploreMode === 'legisladores' ? 'bg-white text-[#8B1A1A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Legisladores
            </button>
          </div>
        </div>

        <div className="card-3d p-4 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8B1A1A] w-6 h-6" />
            <input 
              type="text" 
              placeholder={exploreMode === 'expedientes' ? "Buscar por tema, palabra clave o folio..." : "Buscar por nombre, partido o estado..."}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 focus:border-[#8B1A1A] transition-all  text-lg placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          {exploreMode === 'expedientes' ? (
            <div className="flex space-x-3 overflow-x-auto pb-2 md:pb-0">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-xl px-5 py-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 focus:border-[#8B1A1A] shadow-sm cursor-pointer"
              >
                <option value="Todos">Estado (Todos)</option>
                <option value="En Comisiones">En Comisiones</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
              <select 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-xl px-5 py-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 focus:border-[#8B1A1A] shadow-sm cursor-pointer"
              >
                <option value="Todos">Fecha (Todas)</option>
                <option value="Último mes">Último mes</option>
                <option value="Este año">Este año</option>
              </select>
            </div>
          ) : (
            <div className="flex space-x-3 overflow-x-auto pb-2 md:pb-0">
              <select 
                value={filterParty}
                onChange={(e) => setFilterParty(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 rounded-xl px-5 py-4 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 focus:border-[#8B1A1A] shadow-sm cursor-pointer"
              >
                <option value="Todos">Partido (Todos)</option>
                <option value="MORENA">MORENA</option>
                <option value="PRI">PRI</option>
                <option value="PAN">PAN</option>
                <option value="PVEM">PVEM</option>
                <option value="PT">PT</option>
                <option value="PRD">PRD</option>
                <option value="MC">MC</option>
              </select>
            </div>
          )}
        </div>

        {user && userHistory.length > 0 && !searchQuery && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 font-medium mr-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" /> Búsquedas recientes:
            </span>
            {Array.from(new Set(userHistory.filter(h => h.type === 'search').map(h => h.query))).slice(-5).reverse().map((query, idx) => (
              <button 
                key={idx}
                onClick={() => { handleSearch(query as string); }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-colors"
              >
                {query as string}
              </button>
            ))}
          </div>
        )}

        {searchQuery.trim() && (
          <div className="card-3d p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-bl-full -z-10"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100/50">
                  <Sparkles className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Análisis LEXA IA
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Analiza versiones estenográficas para identificar las posturas de los legisladores sobre "{searchQuery}".
                  </p>
                </div>
              </div>
              <button 
                onClick={handleAiSearch}
                disabled={isAiSearchLoading}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {isAiSearchLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generar Análisis</span>
                  </>
                )}
              </button>
            </div>
            
            {aiSearchResults && (
              <div className="mt-8 card-3d p-8 border-indigo-100/50 relative">
                <button 
                  onClick={exportSummaryToPDF}
                  className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm pdf-exclude"
                  title="Descargar PDF"
                >
                  <DownloadIcon className="w-5 h-5 text-slate-600" />
                </button>
                <div className="prose prose-sm md:prose-base max-w-none text-slate-700 prose-headings:prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-strong:text-slate-900">
                  <Markdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{aiSearchResults}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}

        {exploreMode === 'expedientes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExpedientes.map(exp => (
              <div 
                key={exp.id} 
                onClick={() => setSelectedExpediente(exp)}
                className="card-3d card-3d-hover p-6 cursor-pointer group flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 group-hover:from-[#8B1A1A] group-hover:to-red-500 transition-all duration-500"></div>
                <div className="flex justify-between items-start mb-4 mt-2">
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-[#8B1A1A]/30 group-hover:text-[#8B1A1A] transition-colors shadow-sm">{exp.clave_oficial}</span>
                  <span className="text-xs font-medium text-slate-400">{exp.fecha_inicio}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#8B1A1A] transition-colors leading-snug">{exp.titulo}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1 leading-relaxed">{exp.descripcion}</p>
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Iniciativas relacionadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {expedientes
                      .filter(e => e.tema_principal === exp.tema_principal && e.id !== exp.id)
                      .slice(0, 3)
                      .map((relatedExp) => (
                        <a key={relatedExp.id} href="#" onClick={(e) => { e.preventDefault(); setSelectedExpediente(relatedExp); }} className="text-xs text-indigo-600 hover:underline">
                          {relatedExp.clave_oficial}
                        </a>
                      ))}
                  </div>
                </div>
                

                
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100/50">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-red-50 text-[#8B1A1A] border border-red-100">
                    {exp.tema_principal}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                      {exp.estado_actual}
                    </span>
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shadow-sm border ${
                      exp.impacto_score >= 80 ? 'bg-red-50 text-red-700 border-red-200' :
                      exp.impacto_score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {exp.impacto_score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredExpedientes.length === 0 && (
              <div className="col-span-full p-16 text-center card-3d border-dashed border-slate-300">
                <p className="text-slate-500 font-medium text-lg">No se encontraron expedientes que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLegisladores.map(leg => {
              const municipios = leg.districtId ? (districtMunicipalities[leg.districtId as keyof typeof districtMunicipalities] || []) : [];
              console.log('Legislator:', leg.nombre, 'DistrictId:', leg.districtId, 'Municipios:', municipios);
              return (
                <div 
                  key={leg.id}
                  onClick={() => setSelectedLegislator(leg)}
                  className="card-3d card-3d-hover p-6 cursor-pointer group flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 group-hover:from-[#8B1A1A] group-hover:to-red-500 transition-all duration-500"></div>
                  <div className="absolute top-0 left-0 w-1.5 h-full opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: leg.color }}></div>
                  <div className="flex items-start justify-between mb-6 mt-2 pl-2">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-white/50">
                        <img 
                          src={legisladorData[leg.id]?.foto ? encodeURI(legisladorData[leg.id].foto) : `https://picsum.photos/seed/${leg.id}/100/100`} 
                          alt={leg.nombre} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#8B1A1A] transition-colors leading-tight">{leg.nombre}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{leg.partido} • {leg.tipo_eleccion === 'RP' ? 'Representación Proporcional' : `Distrito ${leg.districtId}`}</p>
                        {legisladorData[leg.id]?.perfil && (
                          <a 
                            href={legisladorData[leg.id].perfil} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#8B1A1A] font-bold hover:underline mt-1 block"
                          >
                            Ver perfil oficial
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {leg.districtId && (
                    <div className="text-xs text-slate-500 mb-4 pl-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Municipios:</span> <span className="font-medium">{municipios.join(", ")}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6 flex-1 pl-2">
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Asistencia</div>
                      <div className="text-2xl font-mono font-light text-slate-900 tracking-tighter">{leg.asistencia}%</div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Lealtad</div>
                      <div className="text-2xl font-mono font-light text-slate-900 tracking-tighter">{leg.lealtad}%</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-auto pt-5 border-t border-slate-100/50 pl-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Comisiones:</span> <span className="font-medium">{(leg.comisiones || []).join(", ")}</span>
                  </div>
                </div>
              );
            })}
            {filteredLegisladores.length === 0 && (
              <div className="col-span-full p-16 text-center text-slate-500 card-3d border-dashed border-slate-300">
                <p className="font-medium text-lg">No se encontraron legisladores que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExpedienteDetail = () => {
    console.log("renderExpedienteDetail called");
    if (!selectedExpediente) return null;
    const exp = selectedExpediente;
    const isSaved = savedExpedientes.includes(exp.id);
    const isSubscribed = subscribedExpedientes.includes(exp.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4 pdf-exclude">
          <button onClick={() => setSelectedExpediente(null)} className="hover:text-[#8B1A1A] transition-colors">Explorar</button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-slate-900">{exp.clave_oficial}</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"></div>
          <div className="flex justify-between items-start mb-8 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight max-w-4xl tracking-tight mb-8">{exp.titulo}</h1>
              <div className="flex flex-wrap gap-3 mt-8">
                <button 
                  onClick={() => toggleSaveExpediente(exp.id)}
                  className={`px-5 py-2.5 rounded-xl border transition-all shadow-sm flex items-center space-x-2 text-sm font-bold tracking-wide ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'Guardado' : 'Guardar Expediente'}</span>
                </button>
                <button 
                  onClick={() => toggleSubscribeExpediente(exp.id)}
                  className={`px-5 py-2.5 rounded-xl border transition-all shadow-sm flex items-center space-x-2 text-sm font-bold tracking-wide ${isSubscribed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                >
                  <Bell className={`w-4 h-4 ${isSubscribed ? 'fill-current' : ''}`} />
                  <span>{isSubscribed ? 'Suscrito a Alertas' : 'Activar Alertas'}</span>
                </button>
                <button 
                  onClick={exportSummaryToPDF} 
                  disabled={isAiSearchLoading}
                  className={`px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all shadow-sm flex items-center space-x-2 text-sm font-bold tracking-wide ${isAiSearchLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>{isAiSearchLoading ? 'Generando...' : 'Descargar PDF'}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end card-3d p-4 bg-slate-50">
              <div className="relative group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 cursor-help">Impacto Regulatorio</div>
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Mide la magnitud de los cambios propuestos en la normativa y sus efectos en los sectores afectados.
                </div>
              </div>
              <div className={`text-4xl font-mono font-light tracking-tighter ${
                exp.impacto_score >= 80 ? 'text-red-600' :
                exp.impacto_score >= 60 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {exp.impacto_score}<span className="text-xl text-slate-400 font-normal">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-10 mt-10 border-t border-slate-200 pt-10 pdf-main-grid">
            <div className="col-span-2 space-y-10 pdf-main-content">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                    <BookOpen className="w-5 h-5 text-[#8B1A1A]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Resumen LEXA IA (Ejecutivo)</h3>
                </div>
                <div className="card-3d p-6">
                  <p className="text-slate-700 leading-relaxed text-lg">{exp.resumen_ia.ejecutivo}</p>
                  
                  <div className="mt-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Evidencia Extraída (NLP)</h4>
                    <div className="space-y-4">
                      {exp.resumen_ia.evidencia.map((ev, idx) => (
                        <div key={idx} className="flex items-start space-x-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                          <div>
                            <p className="text-slate-600 italic text-base leading-relaxed">"{ev.texto}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-6 mt-10 pt-10 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Timeline Legislativo</h3>
                </div>
                <div className="relative border-l-2 border-slate-200 ml-5 space-y-8">
                  {exp.eventos.map((evento, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-[3px] border-blue-500 shadow-sm"></div>
                      <div className="text-xs font-mono font-bold text-blue-600 mb-1 uppercase tracking-wider">{evento.fecha}</div>
                      <div className="text-lg font-bold text-slate-900 mb-1">{evento.tipo}</div>
                      <div className="text-base text-slate-600 leading-relaxed">{evento.descripcion}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Section */}
              <div className="mt-12 card-3d overflow-hidden flex flex-col h-[600px] chat-section relative bg-white">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#8B1A1A] to-red-500"></div>
                <div className="bg-white  p-5 border-b border-slate-200 flex items-center space-x-4 mt-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#8B1A1A] flex items-center justify-center shadow-sm">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">LEXA IA - Asistente Legislativo</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Análisis contextual y raciocinio sobre este expediente generado por IA</p>
                  </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6 flex flex-col">
                  {chatMessages.map((msg, idx) => (
                    <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-[#8B1A1A] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                        <div className="text-base whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                          <Markdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-sm p-5 shadow-sm flex items-center space-x-4">
                        <Loader2 className="w-5 h-5 text-[#8B1A1A] animate-spin" />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">LEXA está analizando...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-5 bg-white border-t border-slate-200 pdf-exclude">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Pregunta sobre impactos, actores o contexto..."
                      className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] shadow-sm transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="bg-[#8B1A1A] hover:bg-[#7A1315] text-white p-4 rounded-2xl hover:shadow-sm  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 space-y-8 pdf-sidebar">


              <div className="card-3d card-3d-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wider mt-1">
                  <Users className="w-5 h-5 mr-3 text-slate-500" />
                  Actores Clave
                </h3>
                <div className="space-y-5">
                  {exp.actores.map((actor) => (
                    <div key={actor.nombre} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100/50 pdf-avoid-break" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                      <span className="text-base font-bold text-slate-900">{actor.nombre}</span>
                      <div className="flex items-center space-x-2 mt-1.5" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{actor.rol}</span>
                        {actor.partido !== 'N/A' && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md" style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{actor.partido}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-3d card-3d-hover p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
                <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center uppercase tracking-wider mt-1">
                  <FileText className="w-5 h-5 mr-3 text-slate-500" />
                  Iniciativas Relacionadas
                </h3>
                <table className="w-full text-left text-sm" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] tracking-wider" style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th className="pb-2 font-bold" style={{ paddingBottom: '12px', textAlign: 'left' }}>Iniciativa</th>
                      <th className="pb-2 font-bold text-right" style={{ paddingBottom: '12px', textAlign: 'right' }}>Expediente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expedientes
                      .filter(e => e.id !== exp.id)
                      .map((relatedExp) => (
                        <tr key={relatedExp.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelectedExpediente(relatedExp)} style={{ borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                          <td className="py-3 pr-4 text-slate-700 leading-tight" style={{ padding: '12px 16px 12px 0' }}>{relatedExp.titulo}</td>
                          <td className="py-3 font-bold text-indigo-700 text-right whitespace-nowrap" style={{ padding: '12px 0', textAlign: 'right' }}>{relatedExp.clave_oficial}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                  {expedientes.filter(e => e.id !== exp.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic mt-2">No hay iniciativas relacionadas.</p>
                  )}
              </div>



              </div>
            </div>
          </div>

          {exp.resultado_proyectado && (
            <div className="mt-10 pt-10 border-t border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-5">Resultado Proyectado</h3>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">{exp.resultado_proyectado.descripcion}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3">Impacto Social</h4>
                  <p className="text-base font-bold text-slate-900">
                    {exp.resultado_proyectado.impacto_social.nivel}: <span className="font-medium text-slate-700">{exp.resultado_proyectado.impacto_social.descripcion}</span>
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative group">
                  <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">Carga Regulatoria</h4>
                  <p className="text-base font-bold text-slate-900">
                    {exp.resultado_proyectado.carga_regulatoria.nivel}: <span className="font-medium text-slate-700">{exp.resultado_proyectado.carga_regulatoria.descripcion}</span>
                  </p>
                  
                  {/* Tooltip for Carga Regulatoria */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-72 flex items-start space-x-3">
                    <p className="text-sm text-slate-600 flex-1 leading-relaxed">Cambia tu idioma en cualquier momento desde el menú de ayuda</p>
                    <X className="w-5 h-5 text-slate-400 mt-0.5" />
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
    );
  };

  const renderMapa = () => (
    <div className="space-y-8 max-w-6xl mx-auto w-full pb-16 animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Mapa Legislativo</h1>
          <p className="text-slate-500 mt-2 text-lg">Visualización geográfica de los distritos electorales del Estado de México.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-3d p-4">
          <EdomexMap 
            onDistrictSelect={setSelectedDistrict} 
            onLegislatorSelect={setSelectedLegislator} 
            onDistrictHover={setHoveredDistrict} 
          />
        </div>
        <div className="lg:col-span-1">
          {displayDistrict ? (
            <div 
              className="card-3d animate-in slide-in-from-right duration-300 border-l-8 overflow-hidden"
              style={{ 
                borderColor: legisladores[displayDistrict - 1]?.color || '#ffffff'
              }}
            >
              <div 
                className="p-4 text-white font-bold text-lg"
                style={{ backgroundColor: legisladores[displayDistrict - 1]?.color || '#ffffff' }}
              >
                Distrito {displayDistrict}
              </div>
              <div className="p-6">
                {legisladores[displayDistrict - 1] ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <img 
                        src={legisladorData[legisladores[displayDistrict - 1].id]?.foto || "https://picsum.photos/seed/legislator/200/200"} 
                        alt={legisladores[displayDistrict - 1].nombre} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-4" 
                        referrerPolicy="no-referrer" 
                      />
                      <p className="font-bold text-xl">{legisladores[displayDistrict - 1].nombre}</p>
                      <p className="text-slate-500 text-lg">{legisladores[displayDistrict - 1].partido}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Municipios:</strong> {(districtMunicipalities[displayDistrict as keyof typeof districtMunicipalities] || []).join(', ')}</p>
                      <p><strong>Comisiones:</strong> {(legisladores[displayDistrict - 1].comisiones || []).join(', ')}</p>
                      <p><strong>Asistencia:</strong> {legisladores[displayDistrict - 1].asistencia}%</p>
                      <p><strong>Tipo de elección:</strong> {legisladores[displayDistrict - 1].tipo_eleccion === 'MR' ? 'Mayoría Relativa' : 'Representación Proporcional'}</p>
                      <p><strong>Lealtad:</strong> {legisladores[displayDistrict - 1].lealtad}%</p>
                      <p><strong>Lealtad al Ejecutivo:</strong> {legisladores[displayDistrict - 1].lealtad_ejecutivo}%</p>
                    </div>
                  </div>
                ) : (
                  <p>Información del legislador no disponible.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card-3d p-6 text-slate-500">
              Selecciona o pasa el mouse sobre un distrito en el mapa para ver la información del legislador.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-16 animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona tus preferencias, alertas y elementos guardados.</p>
        </div>
      </div>

      {!user ? (
        <div className="card-3d p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100"></div>
          <UserCircle className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Inicia sesión para ver tu perfil</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">Guarda expedientes, sigue a legisladores y configura alertas personalizadas sobre los temas que te interesan.</p>
          <button onClick={handleLogin} className="px-8 py-4 bg-[#8B1A1A] hover:bg-[#7A1315] hover:shadow-sm  text-white font-bold tracking-wide rounded-2xl transition-all shadow-sm text-lg">
            Iniciar Sesión con Google
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* User Info Card */}
          <div className="card-3d p-8 flex items-center space-x-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8B1A1A]"></div>
            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-sm">
              <img src={user.photoURL || "https://picsum.photos/seed/user/200/200"} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">{user.displayName || 'Usuario'}</h2>
              <p className="text-slate-500 text-lg">{user.email}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                  <Bookmark className="w-4 h-4 mr-2" /> {savedExpedientes.length} Expedientes
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                  <Bell className="w-4 h-4 mr-2" /> {subscribedExpedientes.length} Alertas
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
                  <Star className="w-4 h-4 mr-2" /> {savedLegisladores.length} Legisladores
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Saved Expedientes */}
            <div className="card-3d p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-200"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Bookmark className="w-6 h-6 mr-3 text-blue-600" />
                Expedientes Guardados
              </h3>
              {savedExpedientes.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No tienes expedientes guardados aún.</p>
              ) : (
                <div className="space-y-4">
                  {savedExpedientes.map(id => {
                    const exp = expedientes.find(e => e.id === id);
                    if (!exp) return null;
                    return (
                      <div key={id} className="card-3d card-3d-hover p-5 cursor-pointer group relative overflow-hidden" onClick={() => { setSelectedExpediente(exp); setCurrentView('explorar'); }}>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-blue-500 transition-colors duration-300"></div>
                        <div className="flex justify-between items-start pl-3">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">{exp.clave_oficial}</span>
                          <button onClick={(e) => { e.stopPropagation(); toggleSaveExpediente(id); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-full p-1.5 hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-base font-bold text-slate-800 mt-3 pl-3 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug">{exp.titulo}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subscribed Expedientes */}
            <div className="card-3d p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-200"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Bell className="w-6 h-6 mr-3 text-amber-500" />
                Alertas Activas
              </h3>
              {subscribedExpedientes.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No tienes alertas activas para ningún expediente.</p>
              ) : (
                <div className="space-y-4">
                  {subscribedExpedientes.map(id => {
                    const exp = expedientes.find(e => e.id === id);
                    if (!exp) return null;
                    return (
                      <div key={id} className="card-3d card-3d-hover p-5 cursor-pointer group relative overflow-hidden bg-amber-50/30" onClick={() => { setSelectedExpediente(exp); setCurrentView('explorar'); }}>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-200 group-hover:bg-amber-500 transition-colors duration-300"></div>
                        <div className="flex justify-between items-start pl-3">
                          <span className="font-mono text-xs font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200/50 shadow-sm group-hover:border-amber-300 transition-colors">{exp.clave_oficial}</span>
                          <button onClick={(e) => { e.stopPropagation(); toggleSubscribeExpediente(id); }} className="text-amber-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 hover:bg-red-50 shadow-sm">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-base font-bold text-slate-800 mt-3 pl-3 line-clamp-2 group-hover:text-amber-700 transition-colors leading-snug">{exp.titulo}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Legisladores */}
            <div className="card-3d p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-200"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Star className="w-6 h-6 mr-3 text-purple-600" />
                Legisladores en Seguimiento
              </h3>
              {savedLegisladores.length === 0 ? (
                <p className="text-base text-slate-500 text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No sigues a ningún legislador aún.</p>
              ) : (
                <div className="space-y-4">
                  {savedLegisladores.map(id => {
                    const leg = legisladores.find(l => l.id === id);
                    if (!leg) return null;
                    return (
                      <div key={id} className="card-3d card-3d-hover p-5 cursor-pointer flex items-center justify-between group relative overflow-hidden" onClick={() => { setSelectedLegislator(leg); setCurrentView('explorar'); setExploreMode('legisladores'); }}>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-purple-500 transition-colors duration-300"></div>
                        <div className="flex items-center space-x-4 pl-3">
                          <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                            <img src={leg.avatar || "https://picsum.photos/seed/legislator/100/100"} alt={leg.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors leading-tight">{leg.nombre}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{leg.partido} • {leg.estado}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleSaveLegislador(id); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-full p-1.5 hover:bg-red-50">
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

        <div className="card-3d overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"></div>
          <div className="absolute top-0 left-0 w-2 h-full opacity-70" style={{ backgroundColor: selectedLegislator.color }}></div>
          <div className="p-10 flex flex-col md:flex-row gap-10 items-start pl-12">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden border-4 border-white shadow-sm flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
              <img src={selectedLegislator.foto || "https://picsum.photos/seed/legislator/200/200"} alt={selectedLegislator.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">{selectedLegislator.nombre}</h1>
                  <div className="flex items-center space-x-3 mt-4">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide shadow-sm border border-white/50" style={{ backgroundColor: `${selectedLegislator.color}15`, color: selectedLegislator.color }}>
                      {selectedLegislator.partido}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-bold uppercase tracking-wider text-sm">{selectedLegislator.estado}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium text-sm">{selectedLegislator.tipo}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => toggleSaveLegislador(selectedLegislator.id)}
                    className={`px-5 py-2.5 rounded-xl border transition-all shadow-sm flex items-center space-x-2 text-sm font-bold tracking-wide ${isSaved ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                  >
                    <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isSaved ? 'Siguiendo' : 'Seguir'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asistencia</p>
                  <p className="text-3xl font-mono font-light text-slate-900 tracking-tighter">{selectedLegislator.asistencia}%</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Iniciativas</p>
                  <p className="text-3xl font-mono font-light text-slate-900 tracking-tighter">{selectedLegislator.iniciativas_presentadas}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aprobadas</p>
                  <p className="text-3xl font-mono font-light text-emerald-600 tracking-tighter">{selectedLegislator.iniciativas_aprobadas}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 p-10 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Comisiones</h3>
            <div className="flex flex-wrap gap-3">
              {selectedLegislator.comisiones.map((comision: string) => (
                <span key={comision} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:border-[#8B1A1A]/30 hover:text-[#8B1A1A] transition-colors cursor-default">
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
    <div className="space-y-8 max-w-6xl mx-auto w-full pb-16 animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Centro de Alertas</h1>
          <p className="text-slate-500 mt-2 text-lg">Notificaciones sobre cambios de estado, nuevos documentos y riesgos.</p>
        </div>
        <button className="text-sm font-bold uppercase tracking-wider text-[#8B1A1A] hover:text-[#7A1315] bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-colors shadow-sm">Marcar todas como leídas</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          {alertas.map(alerta => {
            const exp = expedientes.find(e => e.clave_oficial === alerta.expediente);
            
            return (
            <div 
              key={alerta.id} 
              onClick={() => {
                if (exp) {
                  setSelectedExpediente(exp);
                  setCurrentView('explorar');
                }
              }}
              className={`card-3d card-3d-hover p-6 cursor-pointer group relative overflow-hidden ${alerta.leida ? '' : 'bg-red-50/30 border-red-200/60'}`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-300 ${alerta.leida ? 'bg-slate-200 group-hover:bg-[#8B1A1A]' : 'bg-red-400 group-hover:bg-red-600'}`}></div>
              <div className="flex gap-5 pl-3">
                <div className="flex-shrink-0 mt-1">
                  {alerta.severidad === 'alta' ? (
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm group-hover:bg-red-100 transition-colors">
                      <ShieldAlert className="w-6 h-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm group-hover:bg-blue-100 transition-colors">
                      <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-lg group-hover:text-[#8B1A1A] transition-colors">{alerta.tipo}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{alerta.expediente}</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{new Date(alerta.fecha).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 text-base leading-relaxed mb-4">{alerta.mensaje}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
                    {exp ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExpediente(exp);
                          setCurrentView('explorar');
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#8B1A1A] hover:text-[#7A1315] transition-colors flex items-center"
                      >
                        Ver expediente <ChevronRight className="w-3 h-3 ml-1" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin expediente asociado</span>
                    )}
                    {!alerta.leida && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-100 shadow-sm">
                        Nueva
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        <div className="space-y-8">
          <div className="card-3d p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center">
              <Search className="w-6 h-6 mr-3 text-slate-400" />
              Alertas por Palabra Clave
            </h3>
            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              Recibe notificaciones cuando se publiquen nuevos expedientes que contengan estas palabras clave.
            </p>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('keyword') as HTMLInputElement;
                if (input.value.trim()) {
                  toggleAlertKeyword(input.value.trim());
                  input.value = '';
                }
              }}
              className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6"
            >
              <input 
                type="text" 
                name="keyword"
                placeholder="Ej. Medio Ambiente, Presupuesto..." 
                className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] shadow-sm transition-all placeholder:text-slate-400"
              />
              <button type="submit" className="px-8 py-3.5 bg-slate-800 text-white rounded-2xl text-sm font-bold tracking-wide hover:from-slate-700 hover:to-slate-800 hover:shadow-sm  transition-all whitespace-nowrap">
                Agregar Alerta
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              {alertKeywords.length === 0 ? (
                <span className="text-sm text-slate-400 italic">No hay palabras clave configuradas.</span>
              ) : (
                alertKeywords.map((keyword, idx) => (
                  <span key={idx} className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 shadow-sm group">
                    {keyword}
                    <button 
                      onClick={() => toggleAlertKeyword(keyword)}
                      className="ml-3 text-slate-400 hover:text-red-500 focus:outline-none bg-slate-50 rounded-full p-1 group-hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col font-sans selection:bg-[#8B1A1A]/20 selection:text-[#8B1A1A]">
      {renderTopNav()}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10"></div>
        <div className="flex-1 p-8 overflow-y-auto">
          <div id="pdf-content-wrapper" ref={contentRef} className="max-w-6xl mx-auto">
            {currentView === 'dashboard' && !selectedExpediente && !selectedLegislator && renderDashboard()}
            {currentView === 'explorar' && !selectedExpediente && !selectedLegislator && renderExplorar()}
            {currentView === 'alertas' && !selectedExpediente && !selectedLegislator && renderAlertas()}
            {currentView === 'mapa' && !selectedExpediente && !selectedLegislator && renderMapa()}
            {currentView === 'perfil' && !selectedExpediente && !selectedLegislator && renderPerfil()}
            {selectedExpediente && renderExpedienteDetail()}
            {selectedLegislator && renderLegisladorDetail()}
          </div>
        </div>
      </main>

      {/* Vote Details Modal */}
      {selectedVote && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="card-3d max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-white/20 bg-white">
            <div className="p-8 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm ${
                    selectedVote.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                    selectedVote.estado === 'Rechazada' ? 'bg-red-50 text-red-700 border border-red-100' : 
                    'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {selectedVote.estado}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-bold text-slate-500">{selectedVote.fecha}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedVote.titulo}</h2>
                <p className="text-sm text-slate-500 font-mono mt-2 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-200">{selectedVote.expediente}</p>
              </div>
              <button 
                onClick={() => setSelectedVote(null)}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 bg-slate-50/30">


              {/* AI Summary */}
              <div className="card-3d p-6 relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8B1A1A]"></div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-red-100">
                    <Bot className="w-5 h-5 text-[#8B1A1A]" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">Resumen del Debate (LEXA IA)</h3>
                </div>
                <p className="text-slate-700 text-base leading-relaxed pl-1">
                  {selectedVote.resumen_ia_votacion}
                </p>
              </div>

              {/* Voting Results */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Resultados de la Votación</h3>
                <div className="card-3d p-6">
                  <VoteResults favor={selectedVote.votos_favor} contra={selectedVote.votos_contra} abstencion={selectedVote.abstenciones} expedienteId={selectedVote.expediente} />

                  {/* Party Breakdown */}
                  {selectedVote.desglose_partidos && (
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose por Partido</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          {selectedVote.desglose_partidos.map((partido: any) => {
                            const totalPartido = partido.favor + partido.contra + partido.abstencion;
                            return (
                              <tr key={partido.partido} className="border-b border-slate-100 last:border-0">
                                <td className="py-3 w-32">
                                  <div className="font-bold text-slate-700 flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: partido.color }}></div>
                                    {partido.partido}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-1 h-8 bg-slate-100 rounded-lg overflow-hidden w-full">
                                    {partido.favor > 0 && (
                                      <div 
                                        style={{ width: `${(partido.favor / totalPartido) * 100}%` }} 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center text-xs text-white font-bold"
                                      >
                                        {partido.favor}
                                      </div>
                                    )}
                                    {partido.contra > 0 && (
                                      <div 
                                        style={{ width: `${(partido.contra / totalPartido) * 100}%` }} 
                                        className="h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-xs text-white font-bold"
                                      >
                                        {partido.contra}
                                      </div>
                                    )}
                                    {partido.abstencion > 0 && (
                                      <div 
                                        style={{ width: `${(partido.abstencion / totalPartido) * 100}%` }} 
                                        className="h-full bg-gradient-to-r from-slate-400 to-slate-300 flex items-center justify-center text-xs text-white font-bold"
                                      >
                                        {partido.abstencion}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 w-16 text-right font-mono font-bold text-slate-500">
                                  {totalPartido}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
                          .map((legislador: any) => (
                          <div key={legislador.id} className="flex items-center p-2 bg-white border border-slate-100 rounded-lg hover:border-red-100 transition-colors">
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
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-3d w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 relative bg-white">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"></div>
            <div className="absolute top-0 left-0 w-2 h-full opacity-70" style={{ backgroundColor: selectedLegislator.color }}></div>
            
            <div className="p-8 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-white  z-10 pl-10">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
                  <img 
                    src={legisladorData[selectedLegislator.id]?.foto ? encodeURI(legisladorData[selectedLegislator.id].foto) : `https://picsum.photos/seed/${selectedLegislator.id}/100/100`} 
                    alt={selectedLegislator.nombre} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedLegislator.nombre}</h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border border-white/50" style={{ backgroundColor: `${selectedLegislator.color}15`, color: selectedLegislator.color }}>
                      {selectedLegislator.partido}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{selectedLegislator.estado}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-medium text-slate-500">{selectedLegislator.tipo_eleccion}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLegislator(null)}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto bg-slate-50/30 pl-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card-3d p-6">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Asistencia</div>
                  <div className="text-4xl font-mono font-light text-slate-900 tracking-tighter">{selectedLegislator.asistencia}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-4 ">
                    <div className="bg-emerald-500 h-2 rounded-full shadow-sm" style={{ width: `${selectedLegislator.asistencia}%` }}></div>
                  </div>
                </div>
                <div className="card-3d p-6">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Lealtad Partidista</div>
                  <div className="text-4xl font-mono font-light text-slate-900 tracking-tighter">{selectedLegislator.lealtad}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-4 ">
                    <div className="bg-[#8B1A1A] h-2 rounded-full shadow-sm" style={{ width: `${selectedLegislator.lealtad}%` }}></div>
                  </div>
                </div>
                <div className="card-3d p-6">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Iniciativas Votadas</div>
                  <div className="text-4xl font-mono font-light text-slate-900 tracking-tighter">{(selectedLegislator.historial_votos || []).length}</div>
                </div>
              </div>

              {selectedLegislator.comisiones && selectedLegislator.comisiones.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Comisiones</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLegislator.comisiones.map((comision: string, idx: number) => (
                      <span key={idx} className="text-xs font-bold uppercase text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                        {comision}
                      </span>
                    ))}
                  </div>
                </div>
              )}


              {selectedLegislator.iniciativas_generadas && selectedLegislator.iniciativas_generadas.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Iniciativas Generadas</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedLegislator.iniciativas_generadas.map((expId: string) => {
                      const exp = expedientes.find(e => e.id === expId);
                      return exp ? (
                        <div key={exp.id} className="card-3d p-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">{exp.titulo}</span>
                          <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">{exp.estado_actual}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-900 mb-6">Historial de Votaciones</h3>
              <div className="card-3d overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Iniciativa</th>
                      <th className="px-6 py-4 text-center">Sentido del Voto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {(selectedLegislator.historial_votos || []).map((voto: any, idx: number) => {
                      const votacionInfo = votaciones.find(v => v.id === voto.votacion_id);
                      return (
                        <tr key={idx} className="hover:bg-white transition-colors">
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                            {votacionInfo ? votacionInfo.fecha : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {votacionInfo ? votacionInfo.titulo : 'Votación no encontrada'}
                            {votacionInfo && <div className="text-xs text-slate-400 font-mono mt-1 bg-white/50 inline-block px-2 py-0.5 rounded border border-slate-200">{votacionInfo.expediente}</div>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                              voto.sentido === 'favor' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              voto.sentido === 'contra' ? 'bg-red-50 text-red-700 border-red-100' :
                              voto.sentido === 'abstencion' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                              'bg-amber-50 text-amber-700 border-amber-100'
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
