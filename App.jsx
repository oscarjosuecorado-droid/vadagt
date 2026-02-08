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
  
  // NUEVO: Estado para el motor de búsqueda
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({
    nombre: "", sku: "", precio: "", descripcion: "", fotos: [],
    stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 }
  });

  // NUEVO: Estado de envío con datos de Facturación Formal (Guatemala)
  const [envio, setEnvio] = useState({
    nombre: "", telefono: "", municipio: "", direccion: "",
    nit: "C/F", razonSocial: "" 
  });

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setProductos(lista);
    }, (error) => {
      console.error("Error en conexión Firestore:", error);
    });
    return () => unsub();
  }, []);

  // MOTOR DE BÚSQUEDA FILTRADO (Busca por Nombre o SKU)
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const guardarEnNube = async () => {
    if (!form.nombre || !form.precio) return alert("Ingresa nombre y precio.");
    
    const pData = { 
      nombre: form.nombre,
      sku: form.sku || "", // Importante para el motor de búsqueda
      precio: Number(form.precio),
      descripcion: form.descripcion || "",
      fotos: form.fotos,
      stock: form.stock,
      updatedAt: serverTimestamp() 
    };

    try {
      if (editandoId) {
        await updateDoc(doc(db, "productos", editandoId), pData);
        alert("¡Producto actualizado!");
      } else {
        await addDoc(collection(db, "productos"), { 
          ...pData, 
          createdAt: serverTimestamp() 
        });
        alert("¡Producto guardado exitosamente!");
      }
      cerrarAdmin();
    } catch (err) { 
      console.error("Error al guardar:", err);
      alert("Error de conexión."); 
    }
  };

  const cerrarAdmin = () => {
    setModalAdmin(false);
    setEditandoId(null);
    setForm({ nombre: "", sku: "", precio: "", descripcion: "", fotos: [], stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } });
  };

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

  const agregarAlCarrito = (producto, talla) => {
    setCarrito([...carrito, { ...producto, tallaSeleccionada: talla, cantidad: 1 }]);
    setCarritoAbierto(true);
  };

  // FINALIZAR COMPRA: Incluye los datos de facturación formal en el WhatsApp
  const finalizarCompra = () => {
    const subtotal = carrito.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
    const msg = `*NUEVO PEDIDO VADA GT*\n\n` +
                `*DATOS DE ENVÍO:*\n` +
                `- Nombre: ${envio.nombre}\n` +
                `- Tel: ${envio.telefono}\n` +
                `- Municipio: ${envio.municipio}\n\n` +
                `*DATOS DE FACTURACIÓN:*\n` +
                `- NIT: ${envio.nit}\n` +
                `- Nombre: ${envio.razonSocial || envio.nombre}\n\n` +
                `*PRODUCTOS:*\n${carrito.map(i => `- ${i.nombre} [SKU: ${i.sku || 'N/A'}] [Talla: ${i.tallaSeleccionada}]`).join("\n")}\n\n` +
                `*TOTAL: Q${(subtotal + 35).toFixed(2)}*`;
    
    window.open(`https://wa.me/50247014374?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans italic text-slate-900">
      {/* NAV CON BUSCADOR ESTILO SHEIN */}
      <nav className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 bg-white z-50 shadow-sm">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">VADA <span className="text-blue-600">GT</span></h1>
        
        <div className="relative w-full md:w-96">
          <input