"use client";
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig'; 
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  doc, query, orderBy, serverTimestamp, deleteDoc 
} from "firebase/firestore";

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
    nombre: "", telefono: "", municipio: "", direccion: ""
  });

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProductos(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsub();
  }, []);

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
    const pData = { ...form, precio: Number(form.precio), updatedAt: serverTimestamp() };
    try {
      if (editandoId) {
        await updateDoc(doc(db, "productos", editandoId), pData);
      } else {
        await addDoc(collection(db, "productos"), { ...pData, createdAt: serverTimestamp() });
      }
      cerrarAdmin();
    } catch (err) { alert("Error al conectar con Firebase."); }
  };

  const cerrarAdmin = () => {
    setModalAdmin(false);
    setEditandoId(null);
    setForm({ nombre: "", sku: "", precio: "", descripcion: "", fotos: [], stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } });
  };

  const agregarAlCarrito = (producto, talla) => {
    setCarrito([...carrito, { ...producto, tallaSeleccionada: talla, cantidad: 1 }]);
    setCarritoAbierto(true);
  };

  const finalizarCompra = () => {
    const subtotal = carrito.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
    const msg = `*NUEVO PEDIDO VADA GT*\n\n*CLIENTE:* ${envio.nombre}\n*TEL:* ${envio.telefono}\n*MUNICIPIO:* ${envio.municipio}\n\n*PRODUCTOS:*\n${carrito.map(i => `- ${i.nombre} [Talla: ${i.tallaSeleccionada}]`).join("\n")}\n\n*TOTAL: Q${(subtotal + 35).toFixed(2)}*`;
    window.open(`https://wa.me/50247014374?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans italic text-slate-900">
      {/* NAVBAR */}
      <nav className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">VADA <span className="text-blue-600">GT</span></h1>
        <button onClick={() => { if(prompt("PIN Admin:") === "vada2026") setAdmin(!admin) }} className="text-[10px] font-bold text-slate-300 hover:text-blue-600">MODO ADMIN</button>
      </nav>

      {/* CATÁLOGO */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {productos.map(p => (
          <div key={p.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden flex flex-col relative">
            <div className="aspect-[3/4] relative bg-slate-100">
              {p.fotos?.[0] && <img src={p.fotos[0]} className="w-full h-full object-cover" alt={p.nombre} />}
              {admin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => { setForm(p); setEditandoId(p.id); setModalAdmin(true); }} className="bg-white/90 p-2 rounded-full shadow text-[10px]">✏️</button>
                  <button onClick={async () => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db, "productos", p.id)) }} className="bg-white/90 p-2 rounded-full shadow text-[10px]">🗑️</button>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-black text-sm truncate uppercase">{p.nombre}</h2>
              <p className="text-xl font-black text-blue-600">Q{p.precio.toFixed(2)}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {TALLAS_SISTEMA.map(t => (
                  <button key={t} onClick={() => agregarAlCarrito(p, t)} className="text-[9px] px-2 py-1 rounded-lg border border-black font-bold hover:bg-black hover:text-white transition-all">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN FLOTANTE CARRITO */}
      {carrito.length > 0 && (
        <button onClick={() => setCarritoAbierto(true)} className="fixed bottom-6 right-6 bg-black text-white px-8 py-4 rounded-full shadow-2xl z-50 font-black flex gap-2 items-center">
          🛍️ BOLSA ({carrito.length})
        </button>
      )}

      {/* MODAL ADMIN */}
      {modalAdmin && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6 uppercase text-blue-600 italic">Gestión de Stock</h2>
            <input value={form.nombre} placeholder="Nombre del Producto" className="w-full p-3 bg-slate-100 rounded-xl mb-3" onChange={e => setForm({...form, nombre: e.target.value})} />
            <input value={form.precio} placeholder="Precio Q" type="number" className="w-full p-3 bg-slate-100 rounded-xl mb-3" onChange={e => setForm({...form, precio: e.target.value})} />
            <input type="file" multiple className="mb-4 text-xs" onChange={manejarFotos} />
            <div className="flex gap-2">
              <button onClick={guardarEnNube} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase">GUARDAR PRODUCTO</button>
              <button onClick={cerrarAdmin} className="px-6 bg-slate-100 rounded-2xl text-xs font-bold uppercase">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL CARRITO */}
      {carritoAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-8 flex flex-col">
            <h2 className="text-2xl font-black mb-6">TU PEDIDO</h2>
            <div className="flex-1 overflow-y-auto">
              {carrito.map((item, idx) => (
                <div key={idx} className="border-b py-2 flex justify-between">
                  <span>{item.nombre} ({item.tallaSeleccionada})</span>
                  <span className="font-bold">Q{item.precio}</span>
                </div>
              ))}
            </div>
            <input placeholder="Tu Nombre" className="w-full p-3 border rounded-xl mb-2" onChange={e => setEnvio({...envio, nombre: e.target.value})} />
            <input placeholder="WhatsApp" className="w-full p-3 border rounded-xl mb-2" onChange={e => setEnvio({...envio, telefono: e.target.value})} />
            <button onClick={finalizarCompra} className="w-full bg-green-500 text-white py-4 rounded-2xl font-black">CONFIRMAR POR WHATSAPP</button>
            <button onClick={() => setCarritoAbierto(false)} className="w-full py-4 text-xs uppercase font-bold text-slate-400">Seguir viendo</button>
          </div>
        </div>
      )}

      {admin && (
        <button onClick={() => setModalAdmin(true)} className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl font-black z-50">
          ➕ NUEVO PRODUCTO
        </button>
      )}
    </main>
  );
}