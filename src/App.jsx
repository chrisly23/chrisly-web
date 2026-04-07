import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ArrowRight, ExternalLink, Mail, Phone, 
  MapPin, CheckCircle, Star, Award, TrendingUp, Lock, Trash2, Plus, Settings, Layout, MessageCircle, Briefcase
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

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

  // --- STATE DATA PRODUK ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newProduct, setNewProduct] = useState({ title: '', category: '', description: '', image: '' });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // --- EFEK KONEKSI FIREBASE ---
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
    
    // 1. Ambil Data Produk
    const productsPath = isCanvasEnv 
        ? collection(db, 'artifacts', canvasAppId, 'public', 'data', 'projects')
        : collection(db, 'projects');
        
    const unsubProducts = onSnapshot(productsPath, (snapshot) => {
        setDbConnected(true);
        const fetched = [];
        snapshot.forEach(d => fetched.push({ id: d.id, ...d.data() }));
        setProjects(fetched);
    }, (err) => console.error("Firestore Error:", err));

    // 2. Ambil Pengaturan Situs
    const settingsDocPath = isCanvasEnv
        ? doc(db, 'artifacts', canvasAppId, 'public', 'data', 'settings', 'site_content')
        : doc(db, 'settings', 'site_content');

    const unsubSettings = onSnapshot(settingsDocPath, (docSnap) => {
        if (docSnap.exists()) {
            setSiteSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
    }, (err) => console.error("Settings Error:", err));

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, [user]);

  // --- LOGIKA ADMIN PANEL ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { 
      setCurrentView('admin_dashboard');
      setAdminPassword('');
      setLoginError('');
    } else {
      setLoginError('Password salah! Coba: admin123');
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
        image: newProduct.image || "https://images.unsplash.com/photo-1481481600673-c6c8c1fa5871?auto=format&fit=crop&w=800&q=80"
    };

    if (dbConnected && db) {
        const collectionPath = isCanvasEnv 
            ? collection(db, 'artifacts', canvasAppId, 'public', 'data', 'projects')
            : collection(db, 'projects');
        await addDoc(collectionPath, productData);
    }
    
    setIsAddModalOpen(false);
    setNewProduct({title: '', category: '', description: '', image: ''});
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
    const name = formData.get('name') || 'Klien';
    const message = formData.get('message') || '-';
    const text = `Halo CHrisly Studio, saya ${name}.%0A%0A*Pesan:* ${message}`;
    window.open(`https://wa.me/${siteSettings.waNumber}?text=${text}`, '_blank');
  };

  const getCatalogWALink = (productTitle) => {
    const message = siteSettings.waMessageTemplate.replace('{product}', productTitle);
    return `https://wa.me/${siteSettings.waNumber}?text=${encodeURIComponent(message)}`;
  };

  // --- MODAL COMPONENTS ---
  const DeleteModal = () => {
    if (!deleteId) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-white">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl">
          <div className="flex justify-center mb-4 text-red-500">
            <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30"><Trash2 size={32} /></div>
          </div>
          <h3 className="text-xl font-bold text-center mb-2">Hapus Produk?</h3>
          <p className="text-slate-400 text-center mb-6">Data akan hilang dari database.</p>
          <div className="flex gap-4">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition">Batal</button>
            <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700">Hapus</button>
          </div>
        </div>
      </div>
    );
  };

  const AddModal = () => {
    if (!isAddModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-white">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-lg w-full shadow-2xl relative">
          <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
          <h3 className="text-2xl font-bold mb-6">Tambah Produk</h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <input type="text" placeholder="Nama Produk" required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:ring-2 focus:ring-orange-500 outline-none text-white" />
            <input type="text" placeholder="Kategori" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:ring-2 focus:ring-orange-500 outline-none text-white" />
            <input type="url" placeholder="Link Gambar URL" required value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:ring-2 focus:ring-orange-500 outline-none text-white" />
            <textarea placeholder="Deskripsi" required rows="3" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 focus:ring-2 focus:ring-orange-500 outline-none text-white resize-none" />
            <button type="submit" className="w-full py-3 bg-orange-500 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">Simpan Produk</button>
          </form>
        </div>
      </div>
    );
  };

  // --- LOGIN & DASHBOARD VIEW ---
  if (currentView === 'admin_login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800">
          <div className="flex justify-center mb-6"><div className="bg-blue-500/20 p-4 rounded-full border border-blue-500/30 text-blue-400"><Lock size={32} /></div></div>
          <h2 className="text-2xl font-bold text-center mb-8">Login Admin Studio</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 rounded-lg border border-slate-800 text-white focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="admin123" required />
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-all text-white">Login Sekarang</button>
            <button type="button" onClick={() => setCurrentView('public')} className="w-full py-3 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all">Kembali ke Web</button>
          </form>
        </div>
      </div>
    );
  }

  if (currentView === 'admin_dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
        <DeleteModal /> <AddModal />
        <nav className="bg-slate-900 px-6 py-4 flex justify-between items-center shadow-lg border-b border-slate-800 sticky top-0 z-50">
          <div className="font-bold text-xl tracking-tight text-white">⚙️ <span className="text-blue-500">CH</span>risly <span className="text-orange-500">Admin</span></div>
          <div className="flex space-x-4"><button onClick={() => setCurrentView('public')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors">Lihat Live</button><button onClick={() => setCurrentView('public')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-sm transition-colors">Logout</button></div>
        </nav>
        <div className="flex-grow max-w-7xl w-full mx-auto p-6 lg:p-8">
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl w-fit border border-slate-800 mb-8">
            <button onClick={() => setAdminTab('products')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${adminTab === 'products' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'}`}><Layout size={16} className="mr-2" /> Produk</button>
            <button onClick={() => setAdminTab('settings')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${adminTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}><Settings size={16} className="mr-2" /> Konten Situs</button>
          </div>
          {adminTab === 'products' ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b border-slate-800"><h2 className="text-2xl font-bold">Daftar Katalog</h2><button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-orange-500 rounded-lg font-bold text-white"><Plus size={18} className="mr-2" /> Tambah</button></div>
                <table className="w-full text-left text-white"><thead><tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-widest"><th className="p-5">Produk</th><th className="p-5">Kategori</th><th className="p-5 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-800">{projects.map((p) => (<tr key={p.id} className="hover:bg-slate-800/50"><td className="p-5 font-bold flex items-center"><img src={p.image} className="w-10 h-10 rounded mr-4 object-cover border border-slate-700" alt="" />{p.title}</td><td className="p-5 text-slate-300">{p.category}</td><td className="p-5 text-center"><button onClick={() => setDeleteId(p.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={18} /></button></td></tr>))}</tbody></table>
            </div>
          ) : (
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold mb-8">Edit Kata-kata Website</h1>
              <form onSubmit={handleUpdateSettings} className="space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                <div className="space-y-6 pb-8 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-blue-400 flex items-center"><MessageCircle size={20} className="mr-2" /> WhatsApp</h3>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase">Nomor (628...)</label><input type="text" value={siteSettings.waNumber} onChange={e => setSiteSettings({...siteSettings, waNumber: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none" /></div><div><label className="text-xs font-bold text-slate-500 uppercase">Teks Tombol</label><input type="text" value={siteSettings.waButtonText} onChange={e => setSiteSettings({...siteSettings, waButtonText: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none" /></div></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Template Pesan ({'{product}'} = Nama Produk)</label><textarea rows="2" value={siteSettings.waMessageTemplate} onChange={e => setSiteSettings({...siteSettings, waMessageTemplate: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none" /></div>
                </div>
                <div className="space-y-6 pb-8 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center"><Layout size={20} className="mr-2" /> Halaman Depan</h3>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Judul Utama</label><input type="text" value={siteSettings.heroHeading} onChange={e => setSiteSettings({...siteSettings, heroHeading: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Subjudul</label><textarea rows="3" value={siteSettings.heroSubheading} onChange={e => setSiteSettings({...siteSettings, heroSubheading: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none" /></div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center"><Award size={20} className="mr-2" /> Keunggulan Kami</h3>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Judul Bagian</label><input type="text" value={siteSettings.credibilityHeading} onChange={e => setSiteSettings({...siteSettings, credibilityHeading: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Deskripsi</label><textarea rows="4" value={siteSettings.credibilityDescription} onChange={e => setSiteSettings({...siteSettings, credibilityDescription: e.target.value})} className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-white outline-none resize-none" /></div>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg text-white">Simpan Perubahan Web</button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- PUBLIC VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-md shadow-2xl border-b border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="text-2xl font-black tracking-tight text-white"><span className="text-blue-500">CH</span>risly <span className="text-orange-500">STUDIO</span></div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-300 uppercase tracking-widest">
              <a href="#home" className="hover:text-orange-500 transition-colors">Beranda</a>
              <a href="#works" className="hover:text-orange-500 transition-colors">Katalog</a>
              <a href="#credibility" className="hover:text-orange-500 transition-colors">Keunggulan</a>
              <a href={`https://wa.me/${siteSettings.waNumber}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">Hubungi Kami</a>
            </div>
            <div className="md:hidden flex items-center text-white"><button onClick={toggleMenu}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button></div>
        </div>
        {isMenuOpen && (<div className="md:hidden absolute top-full left-0 w-full bg-slate-900 shadow-xl border-t border-slate-800 py-4 px-4 flex flex-col space-y-4 text-white font-bold"><a href="#home" onClick={toggleMenu}>Beranda</a><a href="#works" onClick={toggleMenu}>Katalog</a><a href="#credibility" onClick={toggleMenu}>Keunggulan</a><a href={`https://wa.me/${siteSettings.waNumber}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">Hubungi Kami</a></div>)}
      </nav>

      <main className="flex-grow">
        <section id="home" className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 z-0"><div className="absolute inset-0 bg-slate-950 opacity-90"></div><div className="absolute top-20 right-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div><div className="absolute bottom-40 -left-10 w-80 h-80 bg-orange-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 text-white whitespace-pre-line leading-none">{siteSettings.heroHeading}</h1>
            <p className="mt-4 text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium">{siteSettings.heroSubheading}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6"><a href="#works" className="px-10 py-5 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center">Lihat Katalog <ArrowRight className="ml-3" size={24} /></a><a href="#credibility" className="px-10 py-5 rounded-full bg-slate-800 text-white font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center">Keunggulan Kami</a></div>
          </div>
        </section>

        <section id="works" className="py-24 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20"><h2 className="text-4xl md:text-5xl font-black mb-4 text-white">Katalog Produk Unggulan</h2><p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">Pilih sistem yang telah teruji untuk pendidikan dan bisnis Anda.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {projects.map((project) => (
                <div key={project.id} className="group rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl hover:border-orange-500/50 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative h-72 overflow-hidden"><img src={project.image} alt={project.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-8">
                      <a href={getCatalogWALink(project.title)} target="_blank" rel="noopener noreferrer" className="flex items-center text-orange-400 font-bold text-xl hover:text-orange-300 drop-shadow-xl">{siteSettings.waButtonText} <ExternalLink className="ml-2" size={20} /></a>
                    </div>
                  </div>
                  <div className="p-10"><span className="text-xs font-black text-orange-500 tracking-widest uppercase">{project.category}</span><h3 className="text-3xl font-bold mt-2 mb-4 text-white group-hover:text-blue-400 transition-colors leading-tight">{project.title}</h3><p className="text-slate-400 leading-relaxed text-lg">{project.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="credibility" className="py-24 bg-slate-950 text-white border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div><h2 className="text-4xl md:text-5xl font-black mb-8 text-white tracking-tight leading-tight">{siteSettings.credibilityHeading}</h2><p className="text-slate-400 text-xl mb-12 leading-relaxed whitespace-pre-line font-medium">{siteSettings.credibilityDescription}</p>
                <div className="space-y-10">
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 text-blue-400"><Award size={32} /></div><div className="ml-6"><h4 className="text-2xl font-bold text-white mb-2">Kualitas Premium</h4><p className="text-slate-400 text-lg font-medium">Setiap baris kode dibuat dengan ketelitian tingkat tinggi.</p></div></div>
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-orange-500/20 p-3 rounded-xl border border-orange-500/30 text-orange-400"><TrendingUp size={32} /></div><div className="ml-6"><h4 className="text-2xl font-bold text-white mb-2">Fokus pada Hasil</h4><p className="text-slate-400 text-lg font-medium">Sistem yang dirancang untuk efisiensi instansi dan pertumbuhan bisnis.</p></div></div>
                  <div className="flex items-start"><div className="flex-shrink-0 mt-1 bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/30 text-cyan-400"><CheckCircle size={32} /></div><div className="ml-6"><h4 className="text-2xl font-bold text-white mb-2">Layanan Lengkap</h4><p className="text-slate-400 text-lg font-medium">Dari perbaikan hardware hingga pengembangan software kustom.</p></div></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-xl hover:border-blue-500/50 transition-colors"><h3 className="text-5xl font-black text-white mb-3 tracking-tighter">50+</h3><p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Proyek Selesai</p></div>
                <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-xl hover:border-orange-500/50 transition-colors"><h3 className="text-5xl font-black text-blue-400 mb-3 tracking-tighter">35+</h3><p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Klien Puas</p></div>
                <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-xl hover:border-cyan-500/50 transition-colors"><h3 className="text-5xl font-black text-orange-400 mb-3 tracking-tighter">5</h3><p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Penghargaan</p></div>
                <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-xl hover:border-white/20 transition-colors"><h3 className="text-5xl font-black text-white mb-3 tracking-tighter">4th</h3><p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Pengalaman</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden"><div className="grid grid-cols-1 lg:grid-cols-5"><div className="lg:col-span-2 bg-gradient-to-br from-blue-950 to-slate-950 p-12 lg:p-16 text-white flex flex-col justify-center border-r border-slate-800"><div><h2 className="text-4xl font-black mb-6 leading-tight">Mari Berkolaborasi!</h2><p className="text-blue-200 text-lg mb-12 font-medium">Punya ide proyek? Tim kami siap membantu memberikan solusi terbaik.</p><div className="space-y-8"><div className="flex items-center text-white"><Mail className="text-orange-400 mr-5" size={28} /><span className="text-xl font-bold">halo@chrislystudio.id</span></div><div className="flex items-center text-white"><Phone className="text-orange-400 mr-5" size={28} /><span className="text-xl font-bold">+{siteSettings.waNumber}</span></div><div className="flex items-start text-white"><MapPin className="text-orange-400 mr-5 mt-1" size={28} /><span className="text-xl font-bold">Kawasan Teknologi<br />Jakarta Selatan, 12190</span></div></div></div></div>
          <div className="lg:col-span-3 p-12 lg:p-16 bg-slate-900"><form className="space-y-8" onSubmit={handleWhatsAppSubmit}><div><label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Nama Lengkap</label><input type="text" name="name" required className="w-full px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800 text-white font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all" placeholder="John Doe" /></div><div><label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Pesan Detail</label><textarea name="message" required rows="4" className="w-full px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800 text-white font-bold outline-none resize-none focus:ring-2 focus:ring-orange-500 transition-all" placeholder="Ceritakan kebutuhan Anda..."></textarea></div><button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xl hover:bg-orange-600 shadow-2xl transition-all transform hover:-translate-y-1">Kirim via WhatsApp</button></form></div></div></div></div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left"><div><span className="text-3xl font-black tracking-tighter text-white"><span className="text-blue-500">CH</span>risly <span className="text-orange-500">STUDIO</span></span><p className="mt-3 text-base font-medium">© 2026 CHrisly Studio. Mitra Solusi Digital Anda.</p></div><button onClick={() => setCurrentView('admin_login')} className="flex items-center text-slate-600 hover:text-blue-500 transition-colors text-sm font-bold bg-slate-900 px-5 py-2 rounded-xl border border-slate-800 mt-10 md:mt-0"><Lock size={16} className="mr-2" /> Panel Administrator</button></footer>
      <style dangerouslySetInnerHTML={{__html: `@keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } } .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } html { scroll-behavior: smooth; }`}} />
    </div>
  );
};

export default App;