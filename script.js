// ==========================================
// 1. CONTROL DE LA PIZARRA (CAPTURA DE TRAZOS)
// ==========================================
const canvas = document.getElementById('pizarra');
const ctx = canvas.getContext('2d');
const btnLimpiar = document.getElementById('btn-limpiar');

ctx.lineWidth = 6;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#1e293b';

let dibujando = false;

function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
    if (!dibujando) return;
    const pos = obtenerPosicion(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
});

canvas.addEventListener('pointerup', () => { dibujando = false; ctx.closePath(); });
canvas.addEventListener('pointerout', () => { dibujando = false; ctx.closePath(); });
btnLimpiar.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });


// ==========================================
// 2. SISTEMA DE APRENDIZAJE Y LECTURA DE EXCEL
// ==========================================
let diccionarioJapones = [];
let caracterActual = null;

// Elementos de la interfaz (HTML)
const txtTipo = document.getElementById('info-tipo');
const txtSignificado = document.getElementById('texto-significado');
const panelRespuesta = document.getElementById('panel-respuesta');
const btnRevelar = document.getElementById('btn-revelar');
const btnSiguiente = document.getElementById('btn-siguiente');

// Campos de respuesta
const respCaracter = document.getElementById('resp-caracter');
const respRomaji = document.getElementById('resp-romaji');
const respCategoria = document.getElementById('resp-categoria');
const respId = document.getElementById('resp-id');
const respOnyomi = document.getElementById('resp-onyomi');
const respKunyomi = document.getElementById('resp-kunyomi');

// Función para procesar el CSV soportando comas o puntos y comas automáticamente
function procesarCSV(texto) {
    const lineas = texto.split('\n').filter(linea => linea.trim() !== '');
    if (lineas.length === 0) return [];

    // Detectar si Excel usó comas o puntos y comas como separador regional
    const separador = lineas[0].includes(';') ? ';' : ',';
    const cabeceras = lineas[0].split(separador).map(c => c.trim());
    const resultado = [];

    for (let i = 1; i < lineas.length; i++) {
        const valores = lineas[i].split(separador);
        const caracterObj = {};
        
        cabeceras.forEach((cabecera, index) => {
            caracterObj[cabecera] = valores[index] ? valores[index].trim() : "";
        });
        
        resultado.push(caracterObj);
    }
    return resultado;
}

// Cargar el archivo externo datos.csv
async function cargarDatos() {
    try {
        const respuesta = await fetch('datos.csv');
        const textoCSV = await respuesta.text();
        
        diccionarioJapones = procesarCSV(textoCSV);
        
        if(diccionarioJapones.length > 0) {
            presentarDesafio();
        } else {
            txtSignificado.innerText = "El archivo Excel está vacío.";
        }
    } catch (error) {
        txtSignificado.innerText = "Error al conectar con datos.csv";
        console.error(error);
    }
}

// Seleccionar un carácter al azar y pedirle al usuario que lo dibuje
function presentarDesafio() {
    // Ocultar respuestas anteriores y limpiar la pizarra
    panelRespuesta.classList.add('oculto');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Elegir uno al azar
    const indiceAzar = Math.floor(Math.random() * diccionarioJapones.length);
    caracterActual = diccionarioJapones[indiceAzar];
    
    // Mostrar la pregunta en pantalla
    txtTipo.innerText = caracterActual.tipo + " - " + caracterActual.categoria;
    txtSignificado.innerText = `Dibuja: "${caracterActual.significado}"`;
}

// Mostrar las respuestas correctas guardadas en el Excel
function revelarRespuesta() {
    if (!caracterActual) return;
    
    respCaracter.innerText = caracterActual.caracter;
    respRomaji.innerText = caracterActual.romaji;
    respCategoria.innerText = caracterActual.categoria;
    respId.innerText = caracterActual.id_jlpt || "N/A";
    respOnyomi.innerText = caracterActual.onyomi || "No aplica";
    respKunyomi.innerText = caracterActual.kunyomi || "No aplica";
    
    // Hacer visible el bloque de respuesta
    panelRespuesta.classList.remove('oculto');
}

// Eventos de los botones de la App
btnRevelar.addEventListener('click', revelarRespuesta);
btnSiguiente.addEventListener('click', presentarDesafio);

// Iniciar la aplicación al cargar la web
cargarDatos();