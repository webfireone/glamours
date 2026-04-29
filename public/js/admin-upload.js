// Este archivo lo ejecutas localmente con Node.js para subir fotos a Firebase Storage
// npm install firebase @firebase/storage
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, listAll } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    // MISMA CONFIGURACIÓN QUE EN firebase-init.js
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const folderPath = './img'; // Carpeta donde pusiste las fotos descargadas de Facebook

async function uploadAllImages() {
    const files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storageRef = ref(storage, `fotos-colegio/${Date.now()}-${file}`);
        await uploadBytes(storageRef, fileBuffer);
        console.log(`✅ Subida: ${file}`);
    }
    console.log('🎉 Todas las fotos subidas a Firebase Storage');
}

uploadAllImages().catch(console.error);