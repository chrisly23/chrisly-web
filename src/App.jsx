import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ArrowRight, ExternalLink, Mail, Phone, 
  MapPin, CheckCircle, Star, Award, TrendingUp, Lock, Trash2, Plus, Settings, Layout, MessageCircle
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

// --- FIREBASE SETUP ---
let app, auth, db;
const isCanvasEnv = typeof __firebase_config !== 'undefined';
const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
  const firebaseConfig = isCanvasEnv 
    ? JSON.parse(__firebase_config) 
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

  if (firebaseConfig && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.error("Firebase Init Error:", err);
}

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // --- STATE FIREBASE & ADMIN ---
  const [user, setUser] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [currentView, setCurrentView] = useState('public'); 
  const [adminTab, setAdminTab] = useState('products'); 
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- STATE DATA SITUS (Dinamis - Bisa diedit di Admin) ---
  const [siteSettings, setSiteSettings] = useState({
    waNumber: "6281234567890",
    waButtonText: "Tanya Detail via WA",
    waMessageTemplate: "Halo CHrisly Studio, saya ingin tanya detail mengenai produk: *{product}*",
    heroHeading: "Laptop Repair &\nApp Development",
    heroSubheading: "Solusi tuntas untuk perangkat keras dan perangkat lunak. Dari perbaikan laptop profesional hingga pembuatan sistem dan otomatisasi bisnis Anda.",
    credibilityHeading: "Mengapa Memilih CHrisly Studio?",
    credibilityDescription: "Kami bukan sekadar pembuat aplikasi. Kami adalah mitra strategis Anda. Dengan kombinasi keahlian teknis dan visi inovatif, kami memastikan setiap produk digital yang kami rilis memenuhi standar industri global."
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // STATE BARU: Ditambahkan targetLink dan ctaText
  const [newProduct, setNewProduct] = useState({ 
    title: '', category: '', description: '', image: '', targetLink: '', ctaText: '' 
  });
  
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (isCanvasEnv && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    const productsPath = isCanvasEnv 
        ? collection(db, 'artifacts', canvasAppId, 'public', 'data', 'projects')
        : collection(db, 'projects');
        
    const unsubProducts = onSnapshot(productsPath, (snapshot) => {
        setDbConnected(true);
        const fetched = [];
        snapshot.forEach(d => fetched.push({ id: d.id, ...d.data() }));
        setProjects(fetched);
    });

    const settingsDocPath = isCanvasEnv
        ? doc(db, 'artifacts', canvasAppId, 'public', 'data', 'settings', 'site_content')
        : doc(db, 'settings', 'site_content');

    const unsubSettings = onSnapshot(settingsDocPath, (docSnap) => {
        if (docSnap.exists()) {
            setSiteSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { 
      setCurrentView('admin_dashboard');
      setAdminPassword('');
      setLoginError('');
    } else {
      setLoginError('Password salah!');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (dbConnected && db) {
        const settingsDocPath = isCanvasEnv
            ? doc(db, 'artifacts', canvasAppId, 'public', 'data', 'settings', 'site_content')
            : doc(db, 'settings', 'site_content');
        await setDoc(settingsDocPath, siteSettings);
        const btn = e.target.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = "Tersimpan! ✓";
        setTimeout(() => btn.innerText = oldText, 2000);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const productData = {
        title: newProduct.title,
        category: newProduct.category,
        description: newProduct.description,
        image: newProduct.image || "https://images.unsplash.com/photo-1481481600673-c6c8c1fa5871?auto=format&fit=crop&w=800&q=80",
        targetLink: newProduct.targetLink || "",
        ctaText: newProduct.ctaText || "Lihat Selengkapnya"
    };

    if (dbConnected && db) {
        const collectionPath = isCanvasEnv 
            ? collection(db, 'artifacts', canvasAppId, 'public', 'data', 'projects')
            : collection(db, 'projects');
        await addDoc(collectionPath, productData);
    }
    
    setIsAddModalOpen(false);
    setNewProduct({title: '', category: '', description: '', image: '', targetLink: '', ctaText: ''});
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (dbConnected && db) {
        const docPath = isCanvasEnv
            ? doc(db, 'artifacts', canvasAppId, 'public', 'data', 'projects', deleteId)
            : doc(db, 'projects', deleteId);
        await deleteDoc(docPath);
    }
    setDeleteId(null);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = `Halo CHrisly Studio, saya ${formData.get('name') || 'Klien'}.%0A%0A*Pesan:* ${formData.get('message') || '-'}`;
    window.open(`https://wa.me/${siteSettings.waNumber}?text=${text}`, '_blank');
  };

  const getCatalogWALink = (productTitle) => {
    const message = siteSettings.waMessageTemplate.replace('{product}', productTitle);
    return `https://wa.me/${siteSettings.waNumber}?text=${encodeURIComponent(message)}`;
  };

  if (currentView === 'admin_login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-white">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800">
          <div className="flex justify-center mb-6"><div className="bg-blue-500/20 p-4 rounded-full border border-blue-500/30 text-blue-400"><Lock size={32} /></div></div>
          <h2 className="text-2xl font-bold text-center mb-8">Login Admin Studio</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="Password Admin" required />
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-all">Login</button>
            <button type="button" onClick={() => setCurrentView('public')} className="w-full py-3 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700">Kembali</button>
          </form>
        </div>
      </div>
    );
  }

  if (currentView === 'admin_dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans flex flex-col text-white">
        {deleteId && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl">
                    <div className="flex justify-center mb-4 text-red-500"><div className="bg-red-500/20 p-4 rounded-full border border-red-500/30"><Trash2 size={32} /></div></div>
                    <h3 className="text-xl font-bold text-center mb-6">Hapus Produk Ini?</h3>
                    <div className="flex gap-4"><button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-800 rounded-lg hover:bg-slate-800/80">Batal</button><button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700">Hapus</button></div>
                </div>
            </div>
        )}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
                    <h3 className="text-2xl font-bold mb-6">Tambah Produk</h3>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Nama Produk *</label>
                            <input type="text" required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Kategori *</label>
                            <input type="text" placeholder="Contoh: Web Development" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Link Gambar URL *</label>
                            <input type="url" placeholder="https://..." required value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi *</label>
                            <textarea required rows="3" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white resize-none outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-800">
                            <h4 className="text-sm font-bold text-orange-400 mb-4">Pengaturan Link Tombol (Opsional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kalimat Pengarah</label>
                                    <input type="text" placeholder="Cth: Kunjungi Web Demo" value={newProduct.ctaText} onChange={e => setNewProduct({...newProduct, ctaText: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Link Tujuan</label>
                                    <input type="url" placeholder="Cth: https://demo.com" value={newProduct.targetLink} onChange={e => setNewProduct({...newProduct, targetLink: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic">*Jika dikosongkan, tombol link tambahan tidak akan ditampilkan di kartu produk.</p>
                        </div>

                        <button type="submit" className="w-full py-4 mt-2 bg-orange-500 rounded-lg font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/20 text-white">Simpan Produk ke Katalog</button>
                    </form>
                </div>
            </div>
        )}
        <nav className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-50">
          <div className="font-bold text-xl tracking-tight">⚙️ <span className="text-blue-500">CH</span>risly <span className="text-orange-500">Admin</span></div>
          <div className="flex space-x-4"><button onClick={() => setCurrentView('public')} className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Lihat Live</button><button onClick={() => setCurrentView('public')} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500 hover:text-white">Logout</button></div>
        </nav>
        <div className="flex-grow max-w-7xl w-full mx-auto p-6 lg:p-8">
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl w-fit border border-slate-800 mb-8">
            <button onClick={() => setAdminTab('products')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${adminTab === 'products' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'}`}>
                <Layout size={16} className="mr-2" /> Katalog
            </button>
            <button onClick={() => setAdminTab('settings')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${adminTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>
                <Settings size={16} className="mr-2" /> Konten Situs
            </button>
          </div>
          {adminTab === 'products' ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 flex justify-between items-center border-b border-slate-800"><h2 className="text-2xl font-bold">Daftar Produk</h2><button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-orange-500 rounded-lg font-bold hover:bg-orange-600 text-white"><Plus size={18} className="mr-2" /> Tambah</button></div>
                <table className="w-full text-left"><thead><tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-widest"><th className="p-5">Produk</th><th className="p-5 hidden md:table-cell">Kategori</th><th className="p-5 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-800">{projects.map((p) => (<tr key={p.id} className="hover:bg-slate-800/50"><td className="p-5 font-bold flex items-center"><img src={p.image} className="w-10 h-10 rounded mr-4 object-cover border border-slate-700" alt="" /><div className="flex flex-col"><span>{p.title}</span>{p.targetLink && <span className="text-xs text-blue-400 font-normal mt-1 flex items-center"><ExternalLink size={12} className="mr-1"/> Memiliki Link Khusus</span>}</div></td><td className="p-5 text-slate-300 hidden md:table-cell">{p.category}</td><td className="p-5 text-center"><button onClick={() => setDeleteId(p.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={18} /></button></td></tr>))}</tbody></table>
            </div>
          ) : (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold mb-8">Edit Konten Website</h1>
              <form onSubmit={handleUpdateSettings} className="space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                <div className="space-y-6 pb-8 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-blue-400 flex items-center"><MessageCircle size={20} className="mr-2" /> WhatsApp & Kontak</h3>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500">Nomor (628...)</label><input type="text" value={siteSettings.waNumber} onChange={e => setSiteSettings({...siteSettings, waNumber: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="text-xs font-bold text-slate-500">Teks Tombol Overlay WA</label><input type="text" value={siteSettings.waButtonText} onChange={e => setSiteSettings({...siteSettings, waButtonText: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
                    <div><label className="text-xs font-bold text-slate-500">Pesan Otomatis ({'{product}'} = Nama Produk)</label><textarea rows="2" value={siteSettings.waMessageTemplate} onChange={e => setSiteSettings({...siteSettings, waMessageTemplate: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="space-y-6 pb-8 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center"><Layout size={20} className="mr-2" /> Halaman Depan (Hero)</h3>
                    <div><label className="text-xs font-bold text-slate-500">Judul Utama</label><input type="text" value={siteSettings.heroHeading} onChange={e => setSiteSettings({...siteSettings, heroHeading: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Subjudul Deskripsi</label><textarea rows="3" value={siteSettings.heroSubheading} onChange={e => setSiteSettings({...siteSettings, heroSubheading: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center"><Award size={20} className="mr-2" /> Keunggulan Kami</h3>
                    <div><label className="text-xs font-bold text-slate-500">Judul Bagian</label><input type="text" value={siteSettings.credibilityHeading} onChange={e => setSiteSettings({...siteSettings, credibilityHeading: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Isi Deskripsi Keunggulan</label><textarea rows="4" value={siteSettings.credibilityDescription} onChange={e => setSiteSettings({...siteSettings, credibilityDescription: e.target.value})} className="w-full mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg text-white">Simpan Perubahan Situs</button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-2xl border-b border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-white">
            <div className="text-2xl font-black tracking-tighter"><span className="text-blue-500">CH</span>risly <span className="text-orange-500">STUDIO</span></div>
            <div className="hidden md:flex items-center space-x-10 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
              <a href="#home" className="hover:text-orange-500 transition-colors">Beranda</a>
              <a href="#works" className="hover:text-orange-500 transition-colors">Katalog</a>
              <a href="#credibility" className="hover:text-orange-500 transition-colors">Keunggulan</a>
              <a href={`https://wa.me/${siteSettings.waNumber}`} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">Hubungi Kami</a>
            </div>
            <div className="md:hidden flex items-center text-white"><button onClick={toggleMenu}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button></div>
        </div>
        {isMenuOpen && (<div className="md:hidden absolute top-full left-0 w-full bg-slate-900 shadow-xl border-t border-slate-800 py-6 px-6 flex flex-col space-y-5 text-white font-bold animate-in slide-in-from-top-4 duration-300"><a href="#home" onClick={toggleMenu}>Beranda</a><a href="#works" onClick={toggleMenu}>Katalog</a><a href="#credibility" onClick={toggleMenu}>Keunggulan</a><a href={`https://wa.me/${siteSettings.waNumber}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">Hubungi Kami</a></div>)}
      </nav>

      <main className="flex-grow">
        <section id="home" className="relative pt-32 pb-24 lg:pt-64 lg:pb-48 overflow-hidden">
          <div className="absolute inset-0 z-0"><div className="absolute inset-0 bg-slate-950 opacity-90"></div><div className="absolute top-20 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-25 animate-blob"></div><div className="absolute bottom-40 -left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-blob animation-delay-2000"></div></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 text-white whitespace-pre-line leading-tight">{siteSettings.heroHeading}</h1>
            <p className="mt-4 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 font-medium leading-relaxed">{siteSettings.heroSubheading}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4"><a href="#works" className="px-8 py-4 rounded-full bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center transform hover:-translate-y-1">Lihat Katalog <ArrowRight className="ml-2" size={20} /></a><a href="#credibility" className="px-8 py-4 rounded-full bg-slate-800 text-white font-bold text-base border border-slate-700 hover:bg-slate-700 shadow-sm flex items-center justify-center">Keunggulan Kami</a></div>
          </div>
        </section>

        <section id="works" className="py-24 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-black mb-4 text-white tracking-tight">Katalog Produk Unggulan</h2><p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium">Sistem digital terbaik yang dirancang khusus untuk meningkatkan performa Anda.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
              {projects.map((project) => (
                <div key={project.id} className="group rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-xl hover:border-orange-500/50 transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full">
                  <div className="relative h-64 lg:h-80 overflow-hidden"><img src={project.image} alt={project.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-8">
                      <a href={getCatalogWALink(project.title)} target="_blank" rel="noopener noreferrer" className="flex items-center text-orange-400 font-bold text-lg hover:text-orange-300 drop-shadow-xl">{siteSettings.waButtonText} <MessageCircle className="ml-2" size={20} /></a>
                    </div>
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col flex-grow">
                    <span className="text-[10px] md:text-xs font-black text-orange-500 tracking-[0.2em] uppercase mb-3 block">{project.category}</span>
                    <h3 className="text-2xl md:text-3xl font-bold mt-1 mb-4 text-white group-hover:text-blue-400 transition-colors leading-tight">{project.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium mb-6">{project.description}</p>
                    
                    {/* BAGIAN LINK TAMBAHAN JIKA ADA */}
                    <div className="mt-auto">
                        {project.targetLink && (
                            <a href={project.targetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-5 py-2.5 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-lg text-xs md:text-sm font-bold text-blue-400 hover:text-blue-300 transition-all">
                                {project.ctaText} <ExternalLink className="ml-2" size={14} />
                            </a>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <div className="col-span-full py-16 text-center text-slate-600 font-bold italic text-xl">Belum ada katalog produk yang ditambahkan.</div>}
            </div>
          </div>
        </section>

        <section id="credibility" className="py-24 bg-slate-950 border-y border-slate-800 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div><h2 className="text-3xl md:text-4xl font-black mb-6 text-white tracking-tight leading-tight">{siteSettings.credibilityHeading}</h2><p className="text-slate-400 text-base md:text-lg mb-10 leading-relaxed whitespace-pre-line font-medium">{siteSettings.credibilityDescription}</p>
                <div className="space-y-8">
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-600/10"><Award size={28} /></div><div className="ml-6"><h4 className="text-xl font-bold text-white mb-2 tracking-tight">Kualitas Premium</h4><p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed text-white">Ketelitian tinggi dalam setiap baris kode dan detail desain piksel.</p></div></div>
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-orange-600/20 p-3 rounded-2xl border border-orange-500/30 text-orange-400 shadow-lg shadow-orange-600/10"><TrendingUp size={28} /></div><div className="ml-6"><h4 className="text-xl font-bold text-white mb-2 tracking-tight">Fokus pada Hasil</h4><p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed text-white">Sistem yang dirancang untuk efisiensi instansi Anda.</p></div></div>
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-cyan-600/20 p-3 rounded-2xl border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-600/10"><CheckCircle size={28} /></div><div className="ml-6"><h4 className="text-xl font-bold text-white mb-2 tracking-tight">Layanan Lengkap</h4><p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed text-white">Solusi menyeluruh dari perbaikan hardware hingga software kustom.</p></div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center shadow-xl transition-colors"><h3 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">50+</h3><p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-white">Proyek</p></div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center shadow-xl transition-colors"><h3 className="text-4xl md:text-5xl font-black text-blue-400 mb-2 tracking-tighter">35+</h3><p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-white">Klien</p></div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center shadow-xl transition-colors"><h3 className="text-4xl md:text-5xl font-black text-orange-400 mb-2 tracking-tighter">5</h3><p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-white">Penghargaan</p></div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center shadow-xl transition-colors"><h3 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">4th</h3><p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-white">Tahun</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-slate-900/30 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-xl overflow-hidden"><div className="grid grid-cols-1 lg:grid-cols-5"><div className="lg:col-span-2 bg-gradient-to-br from-blue-950 to-slate-950 p-12 lg:p-16 text-white flex flex-col justify-center border-r border-slate-800"><div><h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight tracking-tight">Mari Berkolaborasi!</h2><p className="text-blue-200 text-base md:text-lg mb-12 font-medium leading-relaxed">Punya ide proyek revolusioner? Tim ahli kami siap membantu Anda mewujudkannya sekarang.</p><div className="space-y-8 text-white"><div className="flex items-center text-white"><div className="bg-blue-500/20 p-3 rounded-xl mr-5 text-orange-400 border border-blue-500/20 shadow-md"><Mail size={24} /></div><span className="text-lg md:text-xl font-bold tracking-tight">halo@chrislystudio.id</span></div><div className="flex items-center text-white"><div className="bg-blue-500/20 p-3 rounded-xl mr-5 text-orange-400 border border-blue-500/20 shadow-md"><Phone size={24} /></div><span className="text-lg md:text-xl font-bold tracking-tight">+{siteSettings.waNumber}</span></div></div></div></div>
          <div className="lg:col-span-3 p-12 lg:p-16 bg-slate-900"><form className="space-y-8" onSubmit={handleWhatsAppSubmit}><div><label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Nama Lengkap</label><input type="text" name="name" required className="w-full px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800 text-white font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-base shadow-inner" placeholder="John Doe" /></div><div><label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Detail Pesan</label><textarea name="message" required rows="4" className="w-full px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800 text-white font-medium outline-none resize-none focus:ring-2 focus:ring-orange-500/50 transition-all text-base shadow-inner" placeholder="Pesan Anda..." /></div><button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 shadow-xl transition-all transform hover:-translate-y-1 active:scale-[0.98]">Kirim via WhatsApp</button></form></div></div></div></div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left"><div><span className="text-2xl md:text-3xl font-black tracking-tight text-white"><span className="text-blue-500">CH</span>risly <span className="text-orange-500">STUDIO</span></span><p className="mt-2 text-sm font-medium max-w-xs text-slate-400">Mitra Solusi Digital Terpercaya.</p></div><div className="flex flex-col items-center md:items-end mt-8 md:mt-0"><button onClick={() => setCurrentView('admin_login')} className="flex items-center text-slate-600 hover:text-blue-500 transition-all text-sm font-bold bg-slate-900 px-6 py-2.5 rounded-xl border border-slate-800 hover:border-blue-500/50 shadow-md"><Lock size={16} className="mr-2" /> Admin</button><p className="mt-4 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] text-slate-700">© 2026 CHRISLY STUDIO INDONESIA</p></div></footer>
      <style dangerouslySetInnerHTML={{__html: `@keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } } .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } html { scroll-behavior: smooth; }`}} />
    </div>
  );
};

export default App;