require('dotenv').config(); // Carga las variables del .env
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// 1. CARGAR CREDENCIALES DE FORMA SEGURA
// Ya no usamos el archivo .json directamente en el código
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: "https://vada-gt-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.get('/', (req, res) => {
    res.send('<h1>Plataforma VaDa GT Web</h1><p>Estado: Online y Seguro</p>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("==============================");
    console.log("   VADA GT WEB - INICIADA     ");
    console.log(`   Puerto: ${PORT}            `);
    console.log("==============================");
});