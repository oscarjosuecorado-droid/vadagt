"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, deleteDoc 
} from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCaCz52lh8uU8y-oS4muCeIPVroPdLs2ws",
  authDomain: "vada-gt.firebaseapp.com",
  projectId: "vada-gt",
  storageBucket: "vada-gt.firebasestorage.app",
  messagingSenderId: "412863431800",
  appId: "1:412863431800:web:34af7878daba6f70ca198d"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const TALLAS_SISTEMA = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function VadaGT() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [modalAdmin, setModalAdmin] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    nombre: "", sku: "", precio: "", descripcion: "", fotos: [],
    stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 }
  });

  const [envio, setEnvio] = useState({
    nombre: "", telefono: "", nit: "", direccion: "", 
    aldea: "", canton: "", municipio: "", departamento: "", referencia: ""
  });

  // --- EFECTOS: CARGAR PRODUCTOS ---
  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProductos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsub();
  }, []);

  // --- LÓGICA DE CARRITO (CONTROL DE STOCK) ---
  const agregarAlCarrito = (producto, talla) => {
    setCarrito(prev => {
      const itemExistente = prev.find(item => item.id === producto.id && item.tallaSeleccionada === talla);
      const stockDisponible = producto.stock[talla];

      if (itemExistente) {
        if (itemExistente.cantidad < stockDisponible) {
          return prev.map(item => 
            (item.id === producto.id && item.tallaSeleccionada === talla) 
            ? { ...item, cantidad: item.cantidad + 1 } : item
          );
        } else {
          alert("¡Oops! Ya no hay más unidades disponibles de esta talla.");
          return prev;
        }
      }
      return [...prev, { ...producto, tallaSeleccionada: talla, cantidad: 1 }];
    });
    setCarritoAbierto(true);
  };

  const quitarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  // --- GESTIÓN DE PRODUCTOS (ADMIN) ---
  const manejarFotos = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, fotos: [...prev.fotos, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const guardarEnNube = async () => {
    if (!form.nombre || !form.precio) return alert("Ingresa nombre y precio.");
    const pData = { ...form, precio: parseFloat(form.precio), updatedAt: serverTimestamp() };
    try {
      if (editandoId) {
        await updateDoc(doc(db, "productos", editandoId), pData);
      } else {
        await addDoc(collection(db, "productos"), { ...pData, createdAt: serverTimestamp() });
      }
      cerrarAdmin();
    } catch (err) { alert("Error al guardar."); }
  };

  const cerrarAdmin = () => {
    setModalAdmin(false);
    setEditandoId(null);
    setForm({ nombre: "", sku: "", precio: "", descripcion: "", fotos: [], stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } });
  };

  // --- FINALIZAR COMPRA ---
  const finalizarCompra = async () => {
    if (!envio.nombre || !envio.direccion || carrito.length === 0) return alert("Faltan datos de envío o carrito vacío.");

    try {
      let alertasStock = "";
      for (const item of carrito) {
        const pRef = doc(db, "productos", item.id);
        const nuevoStock = item.stock[item.tallaSeleccionada] - item.cantidad;
        await updateDoc(pRef, { [`stock.${item.tallaSeleccionada}`]: nuevoStock });
        if (nuevoStock <= 2) alertasStock += `\n⚠️ BAJO STOCK: ${item.nombre} (${item.tallaSeleccionada})`;
      }

      const subtotal = carrito.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
      const totalQ = subtotal + 35;
      
      const msg = `*NUEVO PEDIDO VADA GT*\n\n*CLIENTE:* ${envio.nombre}\n*TEL:* ${envio.telefono}\n*LUGAR:* ${envio.municipio}, ${envio.departamento}\n\n*PRODUCTOS:*\n${carrito.map(i => `- ${i.nombre} [Talla: ${i.tallaSeleccionada}] (x${i.cantidad})`).join("\n")}\n\n*TOTAL: Q${totalQ.toFixed(2)}*${alertasStock}`;

      window.open(`https://wa.me/50247014374?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrito([]);
      setCarritoAbierto(false);
    } catch (e) { alert("Error al procesar inventario."); }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans italic text-slate-900">
      {/* HEADER */}
      <nav className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">VADA <span className="text-blue-600">GT</span></h1>
        <button onClick={() => { if(prompt("PIN Admin:") === "vada2026") setAdmin(!admin) }} className="text-[10px] font-bold text-slate-300 hover:text-blue-600">MODO ADMIN</button>
      </nav>

      {/* CATÁLOGO CLIENTE */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {productos.map(p => (
          <div key={p.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden flex flex-col relative">
            <div className="aspect-[3/4] relative bg-slate-100">
              {p.fotos && p.fotos[0] && <img src={p.fotos[0]} className="w-full h-full object-cover" alt={p.nombre} />}
              {admin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => { setForm(p); setEditandoId(p.id); setModalAdmin(true); }} className="bg-white/90 p-2 rounded-full shadow text-[10px]">✏️</button>
                  <button onClick={async () => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db, "productos", p.id)) }} className="bg-white/90 p-2 rounded-full shadow text-[10px]">🗑️</button>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase">{p.sku}</p>
              <h2 className="font-black text-sm truncate uppercase">{p.nombre}</h2>
              <p className="text-xl font-black text-blue-600">Q{p.precio.toFixed(2)}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {TALLAS_SISTEMA.map(t => (
                  <button 
                    key={t}
                    disabled={p.stock[t] <= 0}
                    onClick={() => agregarAlCarrito(p, t)}
                    className={`text-[9px] px-2 py-1 rounded-lg border font-bold transition-all ${p.stock[t] > 0 ? 'border-black hover:bg-black hover:text-white' : 'opacity-20 line-through'}`}
                  >
                    {t} ({p.stock[t]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN CARRITO */}
      <button onClick={() => setCarritoAbierto(true)} className="fixed bottom-6 right-6 bg-black text-white px-8 py-5 rounded-full shadow-2xl z-50 font-black flex gap-4 items-center hover:scale-105 transition-transform">
        <span className="text-xl">🛍️</span>
        <span className="text-xs uppercase tracking-widest">Bolsa ({carrito.reduce((a, b) => a + b.cantidad, 0)})</span>
      </button>

      {/* PANEL CARRITO (CLIENTE) */}
      {carritoAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-8 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">Resumen de Compra</h2>
              <button onClick={() => setCarritoAbierto(false)} className="text-xl">✕</button>
            </div>

            {/* LISTADO DE ITEMS EN CARRITO */}
            <div className="space-y-3 mb-8">
              {carrito.map((item, idx) => (
                <div key={idx} className="flex justify-between bg-slate-50 p-3 rounded-xl border border-dashed">
                  <div>
                    <p className="text-[11px] font-black uppercase">{item.nombre}</p>
                    <p className="text-[9px] text-slate-500">Talla: {item.tallaSeleccionada} | Cant: {item.cantidad}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-600">Q{(item.precio * item.cantidad).toFixed(2)}</p>
                    <button onClick={() => quitarDelCarrito(idx)} className="text-[9px] text-red-500 font-bold uppercase">Quitar</button>
                  </div>
                </div>
              ))}
            </div>

            {/* FORMULARIO ENVÍO */}
            <div className="space-y-3 mb-10">
              <p className="text-[10px] font-black text-blue-600 uppercase">Datos de Entrega</p>
              <input placeholder="Nombre Completo" className="w-full p-3 bg-slate-50 border rounded-xl text-xs" onChange={e => setEnvio({...envio, nombre: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="WhatsApp" className="p-3 bg-slate-50 border rounded-xl text-xs" onChange={e => setEnvio({...envio, telefono: e.target.value})} />
                <input placeholder="Municipio" className="p-3 bg-slate-50 border rounded-xl text-xs" onChange={e => setEnvio({...envio, municipio: e.target.value})} />
              </div>
              <input placeholder="Dirección Exacta" className="w-full p-3 bg-slate-50 border rounded-xl text-xs" onChange={e => setEnvio({...envio, direccion: e.target.value})} />
            </div>

            <div className="mt-auto pt-4 border-t-2">
               <div className="flex justify-between font-black text-2xl text-blue-600 mb-4 uppercase">
                 <span>Total + Envío</span>
                 <span>Q{(carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0) + 35).toFixed(2)}</span>
               </div>
               <button onClick={finalizarCompra} className="w-full bg-green-500 text-white py-6 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:bg-green-600">Confirmar Pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN INVENTARIO */}
      {modalAdmin && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 uppercase text-blue-600 italic">Gestión de Stock</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <input value={form.nombre} placeholder="Nombre del Producto" className="col-span-2 p-3 bg-slate-100 rounded-xl" onChange={e => setForm({...form, nombre: e.target.value})} />
              <input value={form.sku} placeholder="SKU / Ref" className="p-3 bg-slate-100 rounded-xl" onChange={e => setForm({...form, sku: e.target.value})} />
              <input value={form.precio} placeholder="Precio Q" type="number" className="p-3 bg-slate-100 rounded-xl" onChange={e => setForm({...form, precio: e.target.value})} />
              <input type="file" multiple className="col-span-2 text-[10px]" onChange={manejarFotos} />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-8">
              {TALLAS_SISTEMA.map(t => (
                <div key={t} className="text-center">
                  <span className="text-[10px] font-bold">{t}</span>
                  <input type="number" value={form.stock[t]} className="w-full p-2 border rounded-lg text-center font-bold" onChange={e => setForm({...form, stock: {...form.stock, [t]: parseInt(e.target.value) || 0}})} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={guardarEnNube} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase">GUARDAR PRODUCTO</button>
              <button onClick={cerrarAdmin} className="px-6 bg-slate-100 rounded-2xl text-xs font-bold uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL FLOTANTE AGREGAR PRODUCTO */}
      {admin && (
        <button onClick={() => setModalAdmin(true)} className="fixed bottom-24 left-6 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl font-black text-xs uppercase z-50">
          ➕ AGREGAR NUEVO
        </button>
      )}
    </main>
  );
}